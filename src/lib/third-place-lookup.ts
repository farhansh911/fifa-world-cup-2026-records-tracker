import type { GroupStandings } from "@/lib/group-standings";
import { ANNEX_C_ROWS, ANNEX_C_WINNERS } from "@/lib/third-place-assignments";

/** Group winner in each R32 match that faces a best third-placed team (FIFA Art. 12.6). */
export const THIRD_PLACE_MATCH_WINNER: Record<number, string> = {
  74: "E",
  77: "I",
  79: "A",
  80: "L",
  81: "D",
  82: "G",
  85: "B",
  87: "K",
};

export interface ThirdPlaceQualifier {
  group: string;
  name: string;
  teamId: string;
  inTopEight: boolean;
  groupComplete: boolean;
}

const lookupByCombo = new Map<string, Record<string, string>>();

for (const row of ANNEX_C_ROWS) {
  const byWinner: Record<string, string> = {};
  for (let i = 0; i < ANNEX_C_WINNERS.length; i++) {
    byWinner[ANNEX_C_WINNERS[i]] = row[i]!;
  }
  lookupByCombo.set(row.split("").sort().join(""), byWinner);
}

function sortRows<T extends { points: number; goalDifference: number; goalsFor: number; name: string }>(
  rows: T[]
): T[] {
  return [...rows].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.name.localeCompare(b.name)
  );
}

/** Current third-placed side in each group (live), ranked for the eight best-third slots. */
export function getThirdPlaceQualifierCandidates(standings: GroupStandings[]): ThirdPlaceQualifier[] {
  const entries = standings
    .map((g) => {
      const sorted = sortRows(g.rows);
      const third = sorted[2];
      if (!third || third.played === 0) return null;
      return { group: g.group.toUpperCase(), row: third, isComplete: g.isComplete };
    })
    .filter((e): e is NonNullable<typeof e> => e != null);

  const ranked = [...entries].sort(
    (a, b) =>
      b.row.points - a.row.points ||
      b.row.goalDifference - a.row.goalDifference ||
      b.row.goalsFor - a.row.goalsFor ||
      a.row.name.localeCompare(b.row.name)
  );

  return ranked.map((entry, index) => ({
    group: entry.group,
    name: entry.row.name,
    teamId: entry.row.teamId,
    inTopEight: index < 8,
    groupComplete: entry.isComplete,
  }));
}

export function resolveAnnexCThirdPlaceTeam(
  winnerGroup: string,
  standings: GroupStandings[]
): { name: string; resolved: boolean } | null {
  const ranked = getThirdPlaceQualifierCandidates(standings);
  const topEight = ranked.filter((q) => q.inTopEight);
  if (topEight.length < 8) return null;

  const combo = topEight
    .map((q) => q.group)
    .sort()
    .join("");
  const byWinner = lookupByCombo.get(combo);
  if (!byWinner) return null;

  const thirdGroup = byWinner[winnerGroup.toUpperCase()];
  if (!thirdGroup) return null;

  const qualifier = topEight.find((q) => q.group === thirdGroup);
  if (!qualifier) return null;

  const groupStanding = standings.find((g) => g.group.toUpperCase() === thirdGroup);
  const thirdRow = groupStanding?.rows.find((r) => r.teamId === qualifier.teamId);
  const resolved =
    !!thirdRow &&
    (thirdRow.qualification === "qualified" ||
      (thirdRow.qualification === "best-third" && qualifier.groupComplete));

  return { name: qualifier.name, resolved };
}
