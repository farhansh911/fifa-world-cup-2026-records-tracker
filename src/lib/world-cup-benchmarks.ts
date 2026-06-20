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

export function careerGoalsBefore2026(playerName: string): number {
  return PRE_2026_CAREER_WC_GOALS[playerName] ?? 0;
}
