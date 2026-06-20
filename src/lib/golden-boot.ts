import { fetchTournamentLeaders } from "@/lib/espn-stats";
import { getCachedFifaPlayerPhotos, fifaPhotoFor } from "@/lib/fifa-player-photos";
import { canonicalTeamName } from "@/lib/team-aliases";
import { getTeamCode, getFlagUrl } from "@/lib/team-codes";
import { ALL_TIME_BENCHMARKS } from "@/lib/world-cup-benchmarks";

export interface GoldenBootEntry {
  rank: number;
  athleteId: string;
  playerId: string;
  name: string;
  shortName: string;
  team: string;
  teamCode: string;
  flagUrl: string | null;
  photoUrl: string | null;
  goals: number;
  assists: number;
  matches: number;
  goalsPerMatch: number;
  gapToLeader: number;
  isLeader: boolean;
}

export interface GoldenBootWinner {
  year: number;
  player: string;
  country: string;
  goals: number;
}

export interface GoldenBootRace {
  leaders: GoldenBootEntry[];
  standings: GoldenBootEntry[];
  totalScorers: number;
  fontaineRecord: number;
  fontaineHolder: string;
  goalsToFontaine: number | null;
  recentWinners: GoldenBootWinner[];
}

const RECENT_GOLDEN_BOOT: GoldenBootWinner[] = [
  { year: 2022, player: "Kylian Mbappé", country: "France", goals: 8 },
  { year: 2018, player: "Harry Kane", country: "England", goals: 6 },
  { year: 2014, player: "James Rodríguez", country: "Colombia", goals: 6 },
  { year: 2010, player: "Thomas Müller", country: "Germany", goals: 5 },
  { year: 2006, player: "Miroslav Klose", country: "Germany", goals: 5 },
];

function makePlayerId(athleteId: string): string {
  return `player-${athleteId}`;
}

function parseMatches(displayValue: string, shortDisplayValue: string): number {
  const fromLong = displayValue.match(/Matches:\s*(\d+)/i);
  if (fromLong) return parseInt(fromLong[1], 10);
  const fromShort = shortDisplayValue.match(/M:\s*(\d+)/i);
  return fromShort ? parseInt(fromShort[1], 10) : 0;
}

function parseAssists(shortDisplayValue: string, assistMap: Map<string, number>, name: string): number {
  const fromShort = shortDisplayValue.match(/A:\s*(\d+)/i);
  if (fromShort) return parseInt(fromShort[1], 10);
  return assistMap.get(name) ?? 0;
}

function assignRanks(entries: GoldenBootEntry[]): GoldenBootEntry[] {
  let rank = 0;
  let prevGoals = -1;

  return entries.map((entry, index) => {
    if (entry.goals !== prevGoals) {
      rank = index + 1;
      prevGoals = entry.goals;
    }
    return { ...entry, rank };
  });
}

export async function getGoldenBootRace(): Promise<GoldenBootRace> {
  const [{ scorers, assisters }, fifaPhotos] = await Promise.all([
    fetchTournamentLeaders(),
    getCachedFifaPlayerPhotos(),
  ]);
  const assistMap = new Map(assisters.map((a) => [a.name, a.assists]));
  const fontaine = ALL_TIME_BENCHMARKS.find((b) => b.id === "single-tournament-goals")!;

  const topGoals = scorers[0]?.goals ?? 0;

  const raw: GoldenBootEntry[] = scorers.map((s) => {
    const team = canonicalTeamName(s.team);
    const matches = parseMatches(s.displayValue, s.shortDisplayValue);
    const assists = parseAssists(s.shortDisplayValue, assistMap, s.name);

    return {
      rank: 0,
      athleteId: s.athleteId,
      playerId: makePlayerId(s.athleteId),
      name: s.name,
      shortName: s.shortName,
      team,
      teamCode: getTeamCode(team),
      flagUrl: getFlagUrl(team),
      photoUrl: fifaPhotoFor(fifaPhotos, s.name),
      goals: s.goals,
      assists,
      matches,
      goalsPerMatch: matches > 0 ? Math.round((s.goals / matches) * 100) / 100 : s.goals,
      gapToLeader: topGoals - s.goals,
      isLeader: s.goals === topGoals && topGoals > 0,
    };
  });

  const standings = assignRanks(raw);
  const leaders = standings.filter((s) => s.isLeader);

  return {
    leaders,
    standings,
    totalScorers: standings.filter((s) => s.goals > 0).length,
    fontaineRecord: fontaine.value,
    fontaineHolder: fontaine.holder,
    goalsToFontaine: leaders.length > 0 ? Math.max(0, fontaine.value - leaders[0].goals) : null,
    recentWinners: RECENT_GOLDEN_BOOT,
  };
}
