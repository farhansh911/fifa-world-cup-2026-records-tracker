import {
  getCachedMatchGoalScorers,
  mergeTournamentScorers,
} from "@/lib/espn-goal-scorers";

const ESPN_STATS = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/statistics";

export interface TournamentPlayerStat {
  athleteId: string;
  name: string;
  shortName: string;
  team: string;
  goals: number;
  assists: number;
  displayValue: string;
  shortDisplayValue: string;
}

interface EspnLeader {
  value: number;
  displayValue: string;
  shortDisplayValue?: string;
  athlete: {
    id: string;
    displayName: string;
    shortName: string;
    team?: { displayName: string };
  };
}

interface EspnStatCategory {
  name: string;
  leaders: EspnLeader[];
}

function mapLeader(leader: EspnLeader, stat: "goals" | "assists"): TournamentPlayerStat {
  return {
    athleteId: leader.athlete.id,
    name: leader.athlete.displayName,
    shortName: leader.athlete.shortName,
    team: leader.athlete.team?.displayName ?? "",
    goals: stat === "goals" ? leader.value : 0,
    assists: stat === "assists" ? leader.value : 0,
    displayValue: leader.displayValue,
    shortDisplayValue: leader.shortDisplayValue ?? leader.displayValue,
  };
}

export async function fetchTournamentLeaders(): Promise<{
  scorers: TournamentPlayerStat[];
  assisters: TournamentPlayerStat[];
}> {
  try {
    const [res, matchScorers] = await Promise.all([
      fetch(ESPN_STATS, { next: { revalidate: 60 } }),
      getCachedMatchGoalScorers(),
    ]);
    if (!res.ok) {
      return { scorers: matchScorers, assisters: [] };
    }

    const json = (await res.json()) as { stats?: EspnStatCategory[] };
    const categories = json.stats ?? [];

    const goalsCat = categories.find((s) => s.name === "goalsLeaders");
    const assistsCat = categories.find((s) => s.name === "assistsLeaders");

    const apiScorers = (goalsCat?.leaders ?? []).map((l) => mapLeader(l, "goals"));
    const scorers = mergeTournamentScorers(apiScorers, matchScorers);
    const assisters = (assistsCat?.leaders ?? []).map((l) => mapLeader(l, "assists"));

    return { scorers, assisters };
  } catch {
    return { scorers: [], assisters: [] };
  }
}
