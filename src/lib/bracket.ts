import type { Match, MatchStatus } from "@/types/database";
import { buildGroupStandings, resolveKnockoutTeamName, type GroupStandings } from "@/lib/group-standings";

export interface BracketMatch {
  id: string;
  stage: string;
  stageKey: string;
  stageOrder: number;
  matchNumber: number | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  matchDate: string;
  stadium: string | null;
  winner: string | null;
  isPlaceholder: boolean;
}

export interface BracketRound {
  key: string;
  label: string;
  order: number;
  matches: BracketMatch[];
}

const STAGE_ORDER: Record<string, { order: number; label: string }> = {
  "round of 32": { order: 1, label: "Round of 32" },
  "round of 16": { order: 2, label: "Round of 16" },
  "quarter finals": { order: 3, label: "Quarter-finals" },
  "semi finals": { order: 4, label: "Semi-finals" },
  "third place": { order: 5, label: "Third place" },
  final: { order: 6, label: "Final" },
};

function stageKey(summary: string | null): string {
  return (summary ?? "").toLowerCase().trim();
}

function isKnockoutMatch(m: Match): boolean {
  const key = stageKey(m.summary);
  return key !== "" && key !== "group stage";
}

function parseMatchNumber(id: string): number | null {
  const n = id.replace(/^wc2026-/, "");
  const num = parseInt(n, 10);
  return Number.isNaN(num) ? null : num;
}

function pickWinner(
  home: string,
  away: string,
  homeScore: number | null,
  awayScore: number | null,
  status: MatchStatus
): string | null {
  if (status !== "completed" || homeScore == null || awayScore == null) return null;
  if (homeScore > awayScore) return home;
  if (awayScore > homeScore) return away;
  return null;
}

function isPlaceholderName(name: string): boolean {
  return /^Group /i.test(name) || /third place/i.test(name) || /winner of/i.test(name);
}

export function buildTournamentBracket(matches: Match[]): BracketRound[] {
  const standings = buildGroupStandings(matches);
  const knockout = matches.filter(isKnockoutMatch).sort((a, b) => a.match_date.localeCompare(b.match_date));

  const bracketMatches: BracketMatch[] = knockout.map((m) => {
    const key = stageKey(m.summary);
    const meta = STAGE_ORDER[key] ?? { order: 99, label: m.summary ?? "Knockout" };
    const homeRaw = m.home_team?.name ?? "TBD";
    const awayRaw = m.away_team?.name ?? "TBD";
    const homeTeam = resolveKnockoutTeamName(homeRaw, standings);
    const awayTeam = resolveKnockoutTeamName(awayRaw, standings);

    return {
      id: m.id,
      stage: meta.label,
      stageKey: key,
      stageOrder: meta.order,
      matchNumber: parseMatchNumber(m.id),
      homeTeam,
      awayTeam,
      homeScore: m.home_score,
      awayScore: m.away_score,
      status: m.status,
      matchDate: m.match_date,
      stadium: m.stadium,
      winner: pickWinner(homeTeam, awayTeam, m.home_score, m.away_score, m.status),
      isPlaceholder: isPlaceholderName(homeRaw) || isPlaceholderName(awayRaw),
    };
  });

  const roundMap = new Map<string, BracketRound>();

  for (const bm of bracketMatches) {
    if (!roundMap.has(bm.stageKey)) {
      roundMap.set(bm.stageKey, {
        key: bm.stageKey,
        label: bm.stage,
        order: bm.stageOrder,
        matches: [],
      });
    }
    roundMap.get(bm.stageKey)!.matches.push(bm);
  }

  return [...roundMap.values()].sort((a, b) => a.order - b.order);
}

export function getQualifiedTeams(standings: GroupStandings[]): string[] {
  const names: string[] = [];
  for (const g of standings) {
    for (const row of g.rows) {
      if (row.qualification === "qualified") names.push(row.name);
    }
  }
  return names;
}
