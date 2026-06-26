import type { Match, MatchStatus } from "@/types/database";
import { buildGroupStandings, type GroupStandings } from "@/lib/group-standings";
import { resolveKnockoutSlot, type KnockoutSlotDisplay } from "@/lib/bracket-slots";

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
  return /^Group /i.test(name) || /third place/i.test(name) || /winner of/i.test(name) || /^W\d+$/i.test(name) || /^[12][A-L]$/i.test(name);
}

export interface BracketViewMatch {
  matchNumber: number;
  id: string;
  homeRaw: string;
  awayRaw: string;
  home: KnockoutSlotDisplay;
  away: KnockoutSlotDisplay;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  stageLabel: string;
}

function knockoutStageLabel(summary: string | null): string {
  const key = (summary ?? "").toLowerCase().trim();
  const labels: Record<string, string> = {
    "round of 32": "Round of 32",
    "round of 16": "Round of 16",
    "quarter finals": "Quarter-finals",
    "semi finals": "Semi-finals",
    "third place": "Third place",
    final: "Final",
  };
  return labels[key] ?? summary ?? "Knockout";
}

function buildKnockoutWinners(
  knockout: Match[],
  standings: GroupStandings[]
): Map<number, string> {
  const winners = new Map<number, string>();

  for (let pass = 0; pass < 3; pass++) {
    for (const m of knockout) {
      const num = parseMatchNumber(m.id);
      if (num == null || m.status !== "completed" || m.home_score == null || m.away_score == null) {
        continue;
      }

      const homeRaw = m.home_team?.name ?? "TBD";
      const awayRaw = m.away_team?.name ?? "TBD";
      const homeSlot = resolveKnockoutSlot(homeRaw, standings, winners, num);
      const awaySlot = resolveKnockoutSlot(awayRaw, standings, winners, num);
      const homeName = homeSlot.team ?? homeRaw;
      const awayName = awaySlot.team ?? awayRaw;

      if (m.home_score > m.away_score) {
        winners.set(num, homeName);
        winners.set(-num, awayName);
      } else if (m.away_score > m.home_score) {
        winners.set(num, awayName);
        winners.set(-num, homeName);
      }
    }
  }

  return winners;
}

export function buildKnockoutBracketView(
  matches: Match[],
  standings?: GroupStandings[]
): BracketViewMatch[] {
  const groups = standings ?? buildGroupStandings(matches);
  const knockout = matches
    .filter(isKnockoutMatch)
    .sort((a, b) => (parseMatchNumber(a.id) ?? 0) - (parseMatchNumber(b.id) ?? 0));

  const winners = buildKnockoutWinners(knockout, groups);
  const list: BracketViewMatch[] = [];

  for (const m of knockout) {
    const num = parseMatchNumber(m.id);
    if (num == null) continue;

    const homeRaw = m.home_team?.name ?? "TBD";
    const awayRaw = m.away_team?.name ?? "TBD";

    list.push({
      matchNumber: num,
      id: m.id,
      homeRaw,
      awayRaw,
      home: resolveKnockoutSlot(homeRaw, groups, winners, num),
      away: resolveKnockoutSlot(awayRaw, groups, winners, num),
      homeScore: m.home_score,
      awayScore: m.away_score,
      status: m.status,
      stageLabel: knockoutStageLabel(m.summary),
    });
  }

  return list;
}

export function bracketMatchesByNumber(
  matches: BracketViewMatch[] | undefined | null
): Map<number, BracketViewMatch> {
  const map = new Map<number, BracketViewMatch>();
  for (const m of matches ?? []) {
    map.set(m.matchNumber, m);
  }
  return map;
}

export function buildTournamentBracket(matches: Match[]): BracketRound[] {
  const standings = buildGroupStandings(matches);
  const knockout = matches.filter(isKnockoutMatch).sort((a, b) => a.match_date.localeCompare(b.match_date));
  const winners = buildKnockoutWinners(knockout, standings);

  const bracketMatches: BracketMatch[] = knockout.map((m) => {
    const key = stageKey(m.summary);
    const meta = STAGE_ORDER[key] ?? { order: 99, label: m.summary ?? "Knockout" };
    const homeRaw = m.home_team?.name ?? "TBD";
    const awayRaw = m.away_team?.name ?? "TBD";
    const matchNumber = parseMatchNumber(m.id);
    const homeSlot = resolveKnockoutSlot(homeRaw, standings, winners, matchNumber ?? undefined);
    const awaySlot = resolveKnockoutSlot(awayRaw, standings, winners, matchNumber ?? undefined);
    const homeTeam = homeSlot.team ?? homeSlot.code;
    const awayTeam = awaySlot.team ?? awaySlot.code;

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
      isPlaceholder: !homeSlot.resolved || !awaySlot.resolved,
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
  return getQualifiedTeamDetails(standings).map((t) => t.name);
}

export interface QualifiedTeam {
  name: string;
  code: string;
  flag_url: string | null;
  group: string;
  position: number;
  qualificationLabel: string;
}

export function getQualifiedTeamDetails(standings: GroupStandings[]): QualifiedTeam[] {
  const teams: QualifiedTeam[] = [];

  for (const g of standings) {
    if (!g.isComplete) continue;
    for (const row of g.rows) {
      if (row.qualification !== "qualified") continue;
      teams.push({
        name: row.name,
        code: row.code,
        flag_url: row.flag_url,
        group: g.group,
        position: row.position,
        qualificationLabel: row.qualificationLabel,
      });
    }
  }

  return teams.sort(
    (a, b) => a.group.localeCompare(b.group) || a.position - b.position
  );
}

/** Groups A–F on the left path; G–L on the right — mirrors the 2026 bracket split. */
export function splitQualifierSides(teams: QualifiedTeam[] | undefined | null): {
  left: QualifiedTeam[];
  right: QualifiedTeam[];
} {
  const safe = teams ?? [];
  return {
    left: safe.filter((t) => t.group <= "F"),
    right: safe.filter((t) => t.group > "F"),
  };
}

export function teamLastGroupMatchDate(
  teamName: string,
  group: string,
  matches: Match[]
): string | null {
  const groupMatches = matches
    .filter(
      (m) =>
        m.group_name === group &&
        m.summary?.toLowerCase() === "group stage" &&
        m.status === "completed" &&
        (m.home_team?.name === teamName || m.away_team?.name === teamName)
    )
    .sort((a, b) => b.match_date.localeCompare(a.match_date));

  return groupMatches[0]?.match_date ?? null;
}
