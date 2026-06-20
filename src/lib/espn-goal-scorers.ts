import { unstable_cache } from "next/cache";
import { fetchEspnMatchDetail } from "@/lib/espn-match-detail";
import { canonicalTeamName } from "@/lib/team-aliases";
import { normalizePlayerName } from "@/lib/fifa-player-photos";
import type { TournamentPlayerStat } from "@/lib/espn-stats";

const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

/** Week-sized chunks — ESPN scoreboard caps at ~100 events per request. */
const WC_SCOREBOARD_RANGES = [
  "20260611-20260617",
  "20260618-20260624",
  "20260625-20260701",
  "20260702-20260708",
  "20260709-20260715",
  "20260716-20260719",
];

interface EspnScoreboardEvent {
  id: string;
  status?: { type?: { state?: string } };
}

interface AggregatedScorer {
  athleteId: string;
  name: string;
  team: string;
  goals: number;
  matches: Set<string>;
}

async function fetchCompletedEventIds(): Promise<string[]> {
  const ids = new Set<string>();

  await Promise.all(
    WC_SCOREBOARD_RANGES.map(async (range) => {
      try {
        const res = await fetch(`${ESPN_SCOREBOARD}?dates=${range}`, {
          next: { revalidate: 60 },
        });
        if (!res.ok) return;
        const json = (await res.json()) as { events?: EspnScoreboardEvent[] };
        for (const event of json.events ?? []) {
          if (event.status?.type?.state === "post") {
            ids.add(event.id);
          }
        }
      } catch {
        /* skip range */
      }
    })
  );

  return [...ids];
}

async function aggregateGoalScorersFromMatches(): Promise<TournamentPlayerStat[]> {
  const eventIds = await fetchCompletedEventIds();
  const tally = new Map<string, AggregatedScorer>();

  await Promise.all(
    eventIds.map(async (eventId) => {
      const detail = await fetchEspnMatchDetail(eventId);
      if (!detail || detail.status !== "completed") return;

      for (const goal of detail.goals) {
        const team = canonicalTeamName(goal.team);
        const key = goal.athleteId
          ? `id:${goal.athleteId}`
          : `name:${normalizePlayerName(goal.player)}|${team.toLowerCase()}`;

        const existing = tally.get(key);
        if (existing) {
          existing.goals += 1;
          existing.matches.add(eventId);
        } else {
          tally.set(key, {
            athleteId: goal.athleteId ?? key.replace(/^name:/, "name-"),
            name: goal.player,
            team,
            goals: 1,
            matches: new Set([eventId]),
          });
        }
      }
    })
  );

  return [...tally.values()]
    .map((s) => ({
      athleteId: s.athleteId.startsWith("name-") ? s.athleteId : s.athleteId,
      name: s.name,
      shortName: s.name.split(" ").pop() ?? s.name,
      team: s.team,
      goals: s.goals,
      assists: 0,
      displayValue: `Matches: ${s.matches.size}, Goals: ${s.goals}`,
      shortDisplayValue: `M: ${s.matches.size}, G: ${s.goals}: A: 0`,
    }))
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
}

export function mergeTournamentScorers(
  apiScorers: TournamentPlayerStat[],
  matchScorers: TournamentPlayerStat[]
): TournamentPlayerStat[] {
  const merged = new Map<string, TournamentPlayerStat>();

  for (const scorer of apiScorers) {
    merged.set(scorer.athleteId, { ...scorer });
  }

  for (const scorer of matchScorers) {
    const byId = scorer.athleteId.startsWith("name-")
      ? undefined
      : merged.get(scorer.athleteId);
    const byName = [...merged.values()].find(
      (s) => normalizePlayerName(s.name) === normalizePlayerName(scorer.name)
    );
    const existing = byId ?? byName;

    if (existing) {
      if (scorer.goals > existing.goals) {
        existing.goals = scorer.goals;
        existing.displayValue = scorer.displayValue;
        existing.shortDisplayValue = scorer.shortDisplayValue;
      }
      if (!existing.team && scorer.team) existing.team = scorer.team;
    } else {
      merged.set(scorer.athleteId, { ...scorer });
    }
  }

  return [...merged.values()].sort(
    (a, b) => b.goals - a.goals || a.name.localeCompare(b.name)
  );
}

export async function fetchGoalScorersFromMatches(): Promise<TournamentPlayerStat[]> {
  return aggregateGoalScorersFromMatches();
}

export const getCachedMatchGoalScorers = unstable_cache(
  aggregateGoalScorersFromMatches,
  ["espn-match-goal-scorers"],
  { revalidate: 60 }
);
