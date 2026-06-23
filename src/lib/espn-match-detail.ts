import { mapEspnMatchState } from "@/lib/team-aliases";

const ESPN_SUMMARY = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary";

export interface TeamMatchStats {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  yellowCards: number;
  saves: number;
}

export interface GoalEvent {
  minute: string;
  player: string;
  athleteId: string | null;
  team: string;
  description: string;
}

export interface EspnMatchDetail {
  espnEventId: string;
  status: "live" | "scheduled" | "completed" | "postponed";
  statusDetail: string;
  minute: number | null;
  clock: string;
  venue: string;
  attendance: number | null;
  home: { name: string; score: number };
  away: { name: string; score: number };
  homeStats: TeamMatchStats;
  awayStats: TeamMatchStats;
  goals: GoalEvent[];
}

const EMPTY_STATS: TeamMatchStats = {
  possession: 0,
  shots: 0,
  shotsOnTarget: 0,
  corners: 0,
  fouls: 0,
  yellowCards: 0,
  saves: 0,
};

function statValue(stats: Array<{ name: string; displayValue: string }>, name: string): number {
  const s = stats.find((x) => x.name === name);
  if (!s) return 0;
  const n = parseFloat(s.displayValue);
  return Number.isNaN(n) ? 0 : n;
}

function parseTeamStats(stats: Array<{ name: string; displayValue: string }>): TeamMatchStats {
  return {
    possession: statValue(stats, "possessionPct"),
    shots: statValue(stats, "totalShots"),
    shotsOnTarget: statValue(stats, "shotsOnTarget"),
    corners: statValue(stats, "wonCorners"),
    fouls: statValue(stats, "foulsCommitted"),
    yellowCards: statValue(stats, "yellowCards"),
    saves: statValue(stats, "saves"),
  };
}

function parseGoals(keyEvents: Array<Record<string, unknown>>): GoalEvent[] {
  return keyEvents
    .filter((e) => e.scoringPlay === true)
    .map((e) => {
      const team = (e.team as { displayName?: string })?.displayName ?? "";
      const clock = (e.clock as { displayValue?: string })?.displayValue ?? "";
      const text = (e.shortText as string) || (e.text as string) || "Goal";
      const athlete =
        (e.participants as Array<{ athlete?: { displayName?: string; id?: string } }>)?.[0]
          ?.athlete;
      const player = athlete?.displayName ?? text.split(" ")[0];
      return {
        minute: clock,
        player,
        athleteId: athlete?.id ?? null,
        team,
        description: text,
      };
    });
}

export async function fetchEspnMatchDetail(eventId: string): Promise<EspnMatchDetail | null> {
  try {
    const res = await fetch(`${ESPN_SUMMARY}?event=${eventId}`, {
      next: { revalidate: 15 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      header?: {
        competitions?: Array<{
          status: {
            type: { state: string; description: string; shortDetail?: string };
            displayClock?: string;
          };
          attendance?: number;
          competitors: Array<{
            homeAway: "home" | "away";
            score: string;
            team: { displayName: string };
          }>;
        }>;
      };
      boxscore?: {
        teams: Array<{
          team: { displayName: string };
          statistics: Array<{ name: string; displayValue: string }>;
        }>;
      };
      gameInfo?: { venue?: { fullName?: string } };
      keyEvents?: Array<Record<string, unknown>>;
    };

    const comp = json.header?.competitions?.[0];
    if (!comp) return null;

    const homeC = comp.competitors.find((c) => c.homeAway === "home");
    const awayC = comp.competitors.find((c) => c.homeAway === "away");
    if (!homeC || !awayC) return null;

    const state = comp.status.type.state;
    const status = mapEspnMatchState(state, comp.status.type.description);

    let minute: number | null = null;
    const clockStr = comp.status.displayClock ?? comp.status.type.shortDetail ?? "";
    const m = clockStr.match(/^(\d+)/);
    if (m) minute = parseInt(m[1], 10);

    const boxTeams = json.boxscore?.teams ?? [];
    const homeBox = boxTeams.find((t) => t.team.displayName === homeC.team.displayName);
    const awayBox = boxTeams.find((t) => t.team.displayName === awayC.team.displayName);

    return {
      espnEventId: eventId,
      status,
      statusDetail: comp.status.type.description,
      minute,
      clock: clockStr || comp.status.type.shortDetail || "",
      venue: json.gameInfo?.venue?.fullName ?? "",
      attendance: comp.attendance ?? null,
      home: {
        name: homeC.team.displayName,
        score: parseInt(homeC.score, 10) || 0,
      },
      away: {
        name: awayC.team.displayName,
        score: parseInt(awayC.score, 10) || 0,
      },
      homeStats: homeBox ? parseTeamStats(homeBox.statistics) : { ...EMPTY_STATS },
      awayStats: awayBox ? parseTeamStats(awayBox.statistics) : { ...EMPTY_STATS },
      goals: parseGoals(json.keyEvents ?? []),
    };
  } catch {
    return null;
  }
}
