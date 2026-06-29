import type { GroupStandings } from "@/lib/group-standings";
import {
  resolveAnnexCThirdPlaceTeam,
  THIRD_PLACE_MATCH_WINNER,
} from "@/lib/third-place-lookup";

/** ESPN scoreboard labels like "Round of 32 3 Winner" — not real teams. */
export function isEspnKnockoutPlaceholder(label: string): boolean {
  return /^(Round of (32|16)|Quarterfinal) \d+ Winner$/i.test(label.trim());
}

/** Short FIFA-style code shown until a slot is locked. */
export function formatKnockoutCode(label: string): string {
  const winners = label.match(/^Group ([A-L]) winners$/i);
  if (winners) return `1${winners[1].toUpperCase()}`;

  const runners = label.match(/^Group ([A-L]) runners-up$/i);
  if (runners) return `2${runners[1].toUpperCase()}`;

  if (/third place/i.test(label)) return "3rd";

  const wm = label.match(/^Winner Match (\d+)/i);
  if (wm) return `W${wm[1]}`;

  const lm = label.match(/^Loser Match (\d+)/i);
  if (lm) return `L${lm[1]}`;

  return label;
}

export interface KnockoutSlotDisplay {
  code: string;
  team: string | null;
  resolved: boolean;
}

function allGroupsComplete(standings: GroupStandings[]): boolean {
  return standings.length > 0 && standings.every((g) => g.isComplete);
}

function resolveThirdPlaceTeam(standings: GroupStandings[]): Map<string, string> {
  const thirdRows = standings
    .map((g) => g.rows.find((r) => r.position === 3 && g.isComplete))
    .filter((r): r is NonNullable<typeof r> => r != null);

  const ranked = [...thirdRows].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.name.localeCompare(b.name)
  );

  const topEight = ranked.slice(0, 8);
  const byGroup = new Map<string, string>();
  for (const g of standings) {
    const third = g.rows.find((r) => r.position === 3);
    if (third && topEight.some((t) => t.name === third.name)) {
      byGroup.set(g.group.toUpperCase(), third.name);
    }
  }
  return byGroup;
}

export function resolveKnockoutSlot(
  label: string,
  standings: GroupStandings[],
  knockoutWinners: Map<number, string>,
  matchNumber?: number
): KnockoutSlotDisplay {
  if (isEspnKnockoutPlaceholder(label)) {
    return { code: "TBD", team: null, resolved: false };
  }

  const code = formatKnockoutCode(label);

  const winners = label.match(/^Group ([A-L]) winners$/i);
  if (winners) {
    const g = standings.find((s) => s.group.toUpperCase() === winners[1].toUpperCase());
    if (g?.isComplete) {
      const leader = g.rows.find((r) => r.position === 1);
      return { code, team: leader?.name ?? null, resolved: true };
    }
    const leader = g?.rows.find((r) => r.position === 1);
    if (leader && leader.qualification === "qualified") {
      return { code, team: leader.name, resolved: true };
    }
    return { code, team: null, resolved: false };
  }

  const runners = label.match(/^Group ([A-L]) runners-up$/i);
  if (runners) {
    const g = standings.find((s) => s.group.toUpperCase() === runners[1].toUpperCase());
    if (g?.isComplete) {
      const second = g.rows.find((r) => r.position === 2);
      return { code, team: second?.name ?? null, resolved: true };
    }
    return { code, team: null, resolved: false };
  }

  if (/third place/i.test(label)) {
    const winnerGroup =
      matchNumber != null ? THIRD_PLACE_MATCH_WINNER[matchNumber] : undefined;

    if (winnerGroup) {
      const annex = resolveAnnexCThirdPlaceTeam(winnerGroup, standings);
      if (annex) {
        return { code: "3rd", team: annex.name, resolved: annex.resolved };
      }
    }

    if (!allGroupsComplete(standings)) {
      return { code: "3rd", team: null, resolved: false };
    }
    const thirds = resolveThirdPlaceTeam(standings);
    const groupsInSlot = label.match(/Group ([A-L](?:\/[A-L])*)/i)?.[1]?.split("/") ?? [];
    for (const letter of groupsInSlot) {
      const team = thirds.get(letter.toUpperCase());
      if (team) return { code: "3rd", team, resolved: true };
    }
    return { code: "3rd", team: null, resolved: false };
  }

  const wm = label.match(/^Winner Match (\d+)/i);
  if (wm) {
    const n = parseInt(wm[1], 10);
    const team = knockoutWinners.get(n);
    return { code, team: team ?? null, resolved: !!team };
  }

  const lm = label.match(/^Loser Match (\d+)/i);
  if (lm) {
    const n = parseInt(lm[1], 10);
    const team = knockoutWinners.get(-n);
    return { code, team: team ?? null, resolved: !!team };
  }

  return { code: label, team: label, resolved: true };
}

/**
 * Visual bracket halves — which side of the poster each match sits on.
 *
 * NOT by match number (73–80 vs 81–88). FIFA splits the draw by semi-final path:
 * - Left  → SF101 (QF97 vs QF98) — top half of the knockout tree
 * - Right → SF102 (QF99 vs QF100) — bottom half (includes Brazil vs Japan, M76)
 *
 * @see https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/knockout-stage-match-schedule-bracket
 */
/** Top→bottom: M74/M77 feed M89, then M73/M75→M90 — matches FIFA poster (Germany v Paraguay on top). */
export const BRACKET_LEFT_R32 = [74, 77, 73, 75, 81, 82, 83, 84];
/** Top→bottom: M89 (W74 v W77) then M90 (W73 v W75), then M94/M93. */
export const BRACKET_LEFT_R16 = [89, 90, 94, 93];
export const BRACKET_RIGHT_R32 = [76, 78, 79, 80, 86, 88, 85, 87];
export const BRACKET_RIGHT_R16 = [91, 92, 95, 96];
export const BRACKET_LEFT_QF = [97, 98];
export const BRACKET_RIGHT_QF = [99, 100];
export const BRACKET_SF1 = 101;
export const BRACKET_SF2 = 102;
export const BRACKET_THIRD = 103;
export const BRACKET_FINAL = 104;

/**
 * Vertical row (0–15) on each bracket half — matches FIFA poster tree alignment.
 * R32 occupies even rows; R16 sits between feeder pairs; QF/SF centered on their subtrees.
 */
export const BRACKET_TREE_ROWS = 16;

export const BRACKET_MATCH_ROW: Record<number, number> = {
  74: 0,
  77: 2,
  73: 4,
  75: 6,
  81: 8,
  82: 10,
  83: 12,
  84: 14,
  89: 1,
  90: 5,
  94: 9,
  93: 13,
  97: 3,
  98: 11,
  101: 7,
  76: 0,
  78: 2,
  79: 4,
  80: 6,
  86: 8,
  88: 10,
  85: 12,
  87: 14,
  91: 1,
  92: 5,
  95: 9,
  96: 13,
  99: 3,
  100: 11,
  102: 7,
};

export function bracketMatchesInTreeOrder(numbers: number[]): number[] {
  return [...numbers].sort(
    (a, b) => (BRACKET_MATCH_ROW[a] ?? 0) - (BRACKET_MATCH_ROW[b] ?? 0)
  );
}

export const LEFT_GROUPS = ["A", "B", "C", "D", "E", "F"];
export const RIGHT_GROUPS = ["G", "H", "I", "J", "K", "L"];

const GROUP_ACCENT: Record<string, string> = {
  A: "border-rose-500/40",
  B: "border-sky-500/40",
  C: "border-emerald-500/40",
  D: "border-amber-500/40",
  E: "border-violet-500/40",
  F: "border-cyan-500/40",
  G: "border-orange-500/40",
  H: "border-pink-500/40",
  I: "border-blue-500/40",
  J: "border-lime-500/40",
  K: "border-fuchsia-500/40",
  L: "border-teal-500/40",
};

const GROUP_LABEL: Record<string, string> = {
  A: "text-emerald-400",
  B: "text-rose-400",
  C: "text-amber-400",
  D: "text-sky-400",
  E: "text-violet-400",
  F: "text-cyan-400",
  G: "text-orange-400",
  H: "text-pink-400",
  I: "text-blue-400",
  J: "text-lime-400",
  K: "text-fuchsia-400",
  L: "text-teal-400",
};

export function groupAccentBorder(group: string): string {
  return GROUP_ACCENT[group.toUpperCase()] ?? "border-white/20";
}

export function groupAccentLabel(group: string): string {
  return GROUP_LABEL[group.toUpperCase()] ?? "text-white/70";
}
