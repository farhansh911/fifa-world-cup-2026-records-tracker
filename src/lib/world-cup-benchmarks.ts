import type { ImportanceLevel } from "@/types/database";

export interface HistoricalBenchmark {
  id: string;
  title: string;
  holder: string;
  value: number;
  unit: string;
  importance: ImportanceLevel;
  description: string;
}

/** All-time FIFA World Cup records we track during the 2026 tournament. */
export const ALL_TIME_BENCHMARKS: HistoricalBenchmark[] = [
  {
    id: "career-goals",
    title: "Most FIFA World Cup goals (all-time)",
    holder: "Miroslav Klose",
    value: 16,
    unit: "goals",
    importance: "legendary",
    description: "Total career goals across all World Cup tournaments.",
  },
  {
    id: "career-goals-second",
    title: "2nd-most World Cup goals (all-time)",
    holder: "Ronaldo",
    value: 15,
    unit: "goals",
    importance: "high",
    description: "Brazil's Ronaldo held this mark before the 2026 chase.",
  },
  {
    id: "single-tournament-goals",
    title: "Most goals in one World Cup tournament",
    holder: "Just Fontaine",
    value: 13,
    unit: "goals",
    importance: "legendary",
    description: "Fontaine scored 13 at Sweden 1958 — the single-edition record.",
  },
  {
    id: "team-goals-match",
    title: "Most goals by one team in a World Cup match",
    holder: "Hungary / Germany / shared",
    value: 10,
    unit: "goals",
    importance: "high",
    description: "Hungary 10–1 El Salvador (1982); Germany also scored 10 vs UAE (2002).",
  },
  {
    id: "career-assists",
    title: "Most FIFA World Cup assists (all-time)",
    holder: "Thomas Müller",
    value: 8,
    unit: "assists",
    importance: "high",
    description: "Total career assists across all World Cup tournaments.",
  },
  {
    id: "career-appearances",
    title: "Most FIFA World Cup appearances (all-time)",
    holder: "Lothar Matthäus",
    value: 25,
    unit: "matches",
    importance: "high",
    description: "Matthäus played in five World Cups (1982–1998).",
  },
  {
    id: "match-total-goals",
    title: "Most goals in a single World Cup match",
    holder: "Austria vs Switzerland (1954)",
    value: 12,
    unit: "goals",
    importance: "legendary",
    description: "Austria 7–5 Switzerland in the 1954 quarter-final — 12 combined goals.",
  },
  {
    id: "biggest-margin",
    title: "Biggest margin of victory in a World Cup match",
    holder: "Hungary",
    value: 9,
    unit: "goals",
    importance: "high",
    description: "Hungary beat El Salvador 10–1 at Spain 1982 (9-goal margin).",
  },
  {
    id: "tournaments-with-goal",
    title: "Most FIFA World Cup tournaments with a goal",
    holder: "5 editions (shared)",
    value: 5,
    unit: "tournaments",
    importance: "legendary",
    description: "Scoring in five different World Cup editions was the previous best — no player had reached six before 2026.",
  },
];

/** World Cup goals before the 2026 tournament kicked off (11 June 2026). */
export const PRE_2026_CAREER_WC_GOALS: Record<string, number> = {
  "Lionel Messi": 13,
  "Kylian Mbappé": 12,
  "Harry Kane": 8,
  "Olivier Giroud": 5,
  "Thomas Müller": 10,
  "Cristiano Ronaldo": 8,
  "Neymar": 8,
  "Luka Modrić": 5,
  "Robert Lewandowski": 2,
  "Kevin De Bruyne": 5,
  "Bruno Fernandes": 2,
  "Antoine Griezmann": 5,
  "Ángel Di María": 5,
  "Lautaro Martínez": 3,
  "Erling Haaland": 0,
  "Jonathan David": 0,
};

/** World Cup assists before the 2026 tournament kicked off. */
export const PRE_2026_CAREER_WC_ASSISTS: Record<string, number> = {
  "Thomas Müller": 8,
  "Lionel Messi": 3,
  "Kylian Mbappé": 2,
  "Kevin De Bruyne": 3,
  "Harry Kane": 2,
  "Bruno Fernandes": 2,
  "Luka Modrić": 2,
};

export function careerGoalsBefore2026(playerName: string): number {
  return PRE_2026_CAREER_WC_GOALS[resolveCanonicalPlayerName(playerName)] ?? 0;
}

export function careerAssistsBefore2026(playerName: string): number {
  return PRE_2026_CAREER_WC_ASSISTS[resolveCanonicalPlayerName(playerName)] ?? 0;
}

/**
 * World Cup editions (year) in which the player scored at least once, before 2026.
 * Used to detect multi-tournament scoring milestones (e.g. Ronaldo scoring in a 6th World Cup).
 */
export const PRE_2026_WC_TOURNAMENTS_WITH_GOAL: Record<string, number[]> = {
  "Cristiano Ronaldo": [2006, 2010, 2014, 2018, 2022],
  "Lionel Messi": [2006, 2014, 2018, 2022],
  "Luka Modrić": [2018, 2022],
  "Thomas Müller": [2010, 2014, 2018, 2022],
  "Olivier Giroud": [2014, 2018, 2022],
  "Ángel Di María": [2014, 2022],
  "Antoine Griezmann": [2014, 2018, 2022],
  "Kylian Mbappé": [2018, 2022],
  "Harry Kane": [2018, 2022],
};

const PRE_2026_TOURNAMENT_LOOKUP = new Map<string, number[]>(
  Object.entries(PRE_2026_WC_TOURNAMENTS_WITH_GOAL).map(([name, years]) => [
    name.toLowerCase(),
    years,
  ])
);

/** ESPN sometimes returns partial names — map to canonical keys in PRE_2026 tables. */
const PLAYER_CANONICAL_ALIASES: Record<string, string> = {
  cristiano: "Cristiano Ronaldo",
  "c. ronaldo": "Cristiano Ronaldo",
  messi: "Lionel Messi",
  "l. messi": "Lionel Messi",
  modric: "Luka Modrić",
  "l. modric": "Luka Modrić",
  müller: "Thomas Müller",
  muller: "Thomas Müller",
};

export function resolveCanonicalPlayerName(playerName: string): string {
  const trimmed = playerName.trim();
  const lower = trimmed.toLowerCase();

  if (PRE_2026_WC_TOURNAMENTS_WITH_GOAL[trimmed]) return trimmed;
  if (PRE_2026_CAREER_WC_GOALS[trimmed]) return trimmed;

  const alias = PLAYER_CANONICAL_ALIASES[lower];
  if (alias) return alias;

  for (const canonical of Object.keys(PRE_2026_WC_TOURNAMENTS_WITH_GOAL)) {
    const canonicalLower = canonical.toLowerCase();
    if (lower === canonicalLower || lower.includes(canonicalLower) || canonicalLower.includes(lower)) {
      return canonical;
    }
    const lastName = canonical.split(" ").pop()?.toLowerCase();
    if (lastName && lastName.length > 3 && lower.includes(lastName)) {
      return canonical;
    }
  }

  return trimmed;
}

export function wcTournamentYearsWithGoalBefore2026(playerName: string): number[] {
  const canonical = resolveCanonicalPlayerName(playerName);
  const direct = PRE_2026_WC_TOURNAMENTS_WITH_GOAL[canonical];
  if (direct) return direct;

  const lower = canonical.toLowerCase();
  const exact = PRE_2026_TOURNAMENT_LOOKUP.get(lower);
  if (exact) return exact;

  return [];
}

export function wcTournamentsWithGoalBefore2026(playerName: string): number {
  return wcTournamentYearsWithGoalBefore2026(playerName).length;
}
