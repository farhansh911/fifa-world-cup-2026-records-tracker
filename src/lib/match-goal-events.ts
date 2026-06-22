import { unstable_cache } from "next/cache";
import { fetchEspnMatchDetail, type GoalEvent } from "@/lib/espn-match-detail";

const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

const WC_SCOREBOARD_RANGES = [
  "20260611-20260617",
  "20260618-20260624",
  "20260625-20260701",
  "20260702-20260708",
  "20260709-20260715",
  "20260716-20260719",
];

export interface ParsedMatchGoals {
  espnEventId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  goals: Array<GoalEvent & { minuteNum: number }>;
  playerGoals: Map<string, { player: string; team: string; goals: number; athleteId: string | null }>;
}

export interface MatchGoalHighlights {
  matches: ParsedMatchGoals[];
  hatTricks: Array<{
    player: string;
    team: string;
    goals: number;
    espnEventId: string;
    homeTeam: string;
    awayTeam: string;
    matchDate: string;
  }>;
  fastestGoal: {
    player: string;
    team: string;
    minute: number;
    espnEventId: string;
    homeTeam: string;
    awayTeam: string;
    matchDate: string;
  } | null;
  maxPlayerGoalsInMatch: {
    player: string;
    team: string;
    goals: number;
    espnEventId: string;
    homeTeam: string;
    awayTeam: string;
    matchDate: string;
  } | null;
}

function parseMinute(minute: string): number {
  const m = minute.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 999;
}

async function loadMatchGoalHighlights(): Promise<MatchGoalHighlights> {
  const eventIds = new Set<string>();

  await Promise.all(
    WC_SCOREBOARD_RANGES.map(async (range) => {
      try {
        const res = await fetch(`${ESPN_SCOREBOARD}?dates=${range}`, {
          next: { revalidate: 60 },
        });
        if (!res.ok) return;
        const json = (await res.json()) as { events?: Array<{ id: string; status?: { type?: { state?: string } } }> };
        for (const event of json.events ?? []) {
          if (event.status?.type?.state === "post") eventIds.add(event.id);
        }
      } catch {
        /* skip */
      }
    })
  );

  const matches: ParsedMatchGoals[] = [];
  const hatTricks: MatchGoalHighlights["hatTricks"] = [];
  let fastestGoal: MatchGoalHighlights["fastestGoal"] = null;
  let maxPlayerGoalsInMatch: MatchGoalHighlights["maxPlayerGoalsInMatch"] = null;

  await Promise.all(
    [...eventIds].map(async (eventId) => {
      const detail = await fetchEspnMatchDetail(eventId);
      if (!detail || detail.status !== "completed") return;

      const goals = detail.goals.map((g) => ({ ...g, minuteNum: parseMinute(g.minute) }));
      const playerGoals = new Map<string, { player: string; team: string; goals: number; athleteId: string | null }>();

      for (const goal of goals) {
        const key = goal.athleteId ?? `${goal.player}|${goal.team}`;
        const existing = playerGoals.get(key);
        if (existing) {
          existing.goals += 1;
        } else {
          playerGoals.set(key, {
            player: goal.player,
            team: goal.team,
            goals: 1,
            athleteId: goal.athleteId,
          });
        }

        if (goal.minuteNum < 999) {
          if (!fastestGoal || goal.minuteNum < fastestGoal.minute) {
            fastestGoal = {
              player: goal.player,
              team: goal.team,
              minute: goal.minuteNum,
              espnEventId: eventId,
              homeTeam: detail.home.name,
              awayTeam: detail.away.name,
              matchDate: new Date().toISOString(),
            };
          }
        }
      }

      for (const pg of playerGoals.values()) {
        if (pg.goals >= 3) {
          hatTricks.push({
            player: pg.player,
            team: pg.team,
            goals: pg.goals,
            espnEventId: eventId,
            homeTeam: detail.home.name,
            awayTeam: detail.away.name,
            matchDate: new Date().toISOString(),
          });
        }
        if (!maxPlayerGoalsInMatch || pg.goals > maxPlayerGoalsInMatch.goals) {
          maxPlayerGoalsInMatch = {
            player: pg.player,
            team: pg.team,
            goals: pg.goals,
            espnEventId: eventId,
            homeTeam: detail.home.name,
            awayTeam: detail.away.name,
            matchDate: new Date().toISOString(),
          };
        }
      }

      matches.push({
        espnEventId: eventId,
        homeTeam: detail.home.name,
        awayTeam: detail.away.name,
        homeScore: detail.home.score,
        awayScore: detail.away.score,
        matchDate: new Date().toISOString(),
        goals,
        playerGoals,
      });
    })
  );

  return { matches, hatTricks, fastestGoal, maxPlayerGoalsInMatch };
}

export const getCachedMatchGoalHighlights = unstable_cache(
  loadMatchGoalHighlights,
  ["wc2026-match-goal-highlights-v1"],
  { revalidate: 60 }
);
