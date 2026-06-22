import type { Match, Team } from "@/types/database";

export type QualificationStatus =
  | "qualified"
  | "best-third"
  | "possible"
  | "eliminated"
  | "pending";

export interface GroupStandingRow {
  teamId: string;
  name: string;
  code: string;
  flag_url: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
  qualification: QualificationStatus;
  qualificationLabel: string;
}

export interface GroupStandings {
  group: string;
  rows: GroupStandingRow[];
  matchesPlayed: number;
  matchesTotal: number;
  isComplete: boolean;
}

const MATCHES_PER_TEAM = 3;
const DIRECT_QUALIFIERS = 2;
const BEST_THIRD_SLOTS = 8;

function emptyRow(team: Team): Omit<GroupStandingRow, "position" | "qualification" | "qualificationLabel"> {
  return {
    teamId: team.id,
    name: team.name,
    code: team.code,
    flag_url: team.flag_url,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function sortRows(rows: GroupStandingRow[]): GroupStandingRow[] {
  return [...rows].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.name.localeCompare(b.name)
  );
}

function maxPossiblePoints(row: GroupStandingRow): number {
  const remaining = MATCHES_PER_TEAM - row.played;
  return row.points + remaining * 3;
}

function assignQualification(rows: GroupStandingRow[], isComplete: boolean): GroupStandingRow[] {
  const sorted = sortRows(rows).map((r, i) => ({ ...r, position: i + 1 }));

  const third = sorted[2];
  const fourth = sorted[3];

  return sorted.map((row) => {
    let qualification: QualificationStatus = "pending";
    let qualificationLabel = "In progress";

    if (row.played === 0) {
      return { ...row, qualification, qualificationLabel: "Not started" };
    }

    if (isComplete) {
      if (row.position <= DIRECT_QUALIFIERS) {
        qualification = "qualified";
        qualificationLabel = "Round of 32";
      } else if (row.position === 3) {
        qualification = "best-third";
        qualificationLabel = "Best 3rd place";
      } else {
        qualification = "eliminated";
        qualificationLabel = "Eliminated";
      }
      return { ...row, qualification, qualificationLabel };
    }

    const canCatchSecond =
      row.position > 2 &&
      third != null &&
      maxPossiblePoints(row) >= third.points;

    const canCatchThird =
      row.position > 3 &&
      fourth != null &&
      maxPossiblePoints(row) > (fourth?.points ?? 0);

    if (row.position <= DIRECT_QUALIFIERS) {
      const minPointsToDrop = sorted[2]?.points ?? 0;
      const guaranteedTopTwo =
        row.position === 1
          ? maxPossiblePoints(sorted[1] ?? row) < row.points ||
            (sorted[1] != null &&
              maxPossiblePoints(sorted[1]) < row.points &&
              row.goalDifference > (sorted[2]?.goalDifference ?? -999))
          : maxPossiblePoints(sorted[2] ?? row) < row.points;

      if (guaranteedTopTwo || row.played === MATCHES_PER_TEAM) {
        qualification = "qualified";
        qualificationLabel = "Round of 32";
      } else {
        qualification = "possible";
        qualificationLabel = "Top 2";
      }
    } else if (row.position === 3 && (canCatchSecond || third != null)) {
      qualification = canCatchSecond ? "possible" : "best-third";
      qualificationLabel = canCatchSecond ? "Can reach top 2" : "Best 3rd place";
    } else if (row.position === 3) {
      qualification = "best-third";
      qualificationLabel = "Best 3rd place";
    } else if (canCatchThird || canCatchSecond) {
      qualification = "possible";
      qualificationLabel = canCatchSecond ? "Can reach top 2" : "Still in hunt";
    } else {
      qualification = "eliminated";
      qualificationLabel = "Eliminated";
    }

    return { ...row, qualification, qualificationLabel };
  });
}

function markBestThirdPlace(groups: GroupStandings[]): GroupStandings[] {
  const thirdPlace = groups
    .map((g) => g.rows.find((r) => r.position === 3 && g.isComplete))
    .filter((r): r is GroupStandingRow => r != null);

  const rankedThirds = sortRows(thirdPlace).slice(0, BEST_THIRD_SLOTS);
  const qualifiedThirdNames = new Set(rankedThirds.map((r) => r.name));

  return groups.map((g) => ({
    ...g,
    rows: g.rows.map((row) => {
      if (row.position !== 3 || !g.isComplete) return row;
      if (qualifiedThirdNames.has(row.name)) {
        return {
          ...row,
          qualification: "qualified" as const,
          qualificationLabel: "Round of 32 (3rd)",
        };
      }
      return {
        ...row,
        qualification: "eliminated" as const,
        qualificationLabel: "Eliminated",
      };
    }),
  }));
}

export function buildGroupStandings(matches: Match[]): GroupStandings[] {
  const groupTeams = new Map<string, Map<string, Team>>();

  for (const m of matches) {
    if (!m.group_name || m.summary?.toLowerCase() !== "group stage") continue;
    if (!groupTeams.has(m.group_name)) groupTeams.set(m.group_name, new Map());
    const map = groupTeams.get(m.group_name)!;
    if (m.home_team?.name) map.set(m.home_team.name, m.home_team);
    if (m.away_team?.name) map.set(m.away_team.name, m.away_team);
  }

  const standings: GroupStandings[] = [];

  for (const [group, teamsMap] of [...groupTeams.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const rowMap = new Map<string, GroupStandingRow>();
    for (const team of teamsMap.values()) {
      rowMap.set(team.name, { ...emptyRow(team), position: 0, qualification: "pending", qualificationLabel: "" });
    }

    const groupMatches = matches.filter(
      (m) => m.group_name === group && m.status === "completed" && m.summary?.toLowerCase() === "group stage"
    );

    for (const m of groupMatches) {
      const home = m.home_team?.name;
      const away = m.away_team?.name;
      if (!home || !away) continue;

      const hr = rowMap.get(home);
      const ar = rowMap.get(away);
      if (!hr || !ar) continue;

      const hg = m.home_score ?? 0;
      const ag = m.away_score ?? 0;

      hr.played += 1;
      ar.played += 1;
      hr.goalsFor += hg;
      hr.goalsAgainst += ag;
      ar.goalsFor += ag;
      ar.goalsAgainst += hg;

      if (hg > ag) {
        hr.won += 1;
        hr.points += 3;
        ar.lost += 1;
      } else if (hg < ag) {
        ar.won += 1;
        ar.points += 3;
        hr.lost += 1;
      } else {
        hr.drawn += 1;
        ar.drawn += 1;
        hr.points += 1;
        ar.points += 1;
      }
    }

    const rows = [...rowMap.values()].map((r) => ({
      ...r,
      goalDifference: r.goalsFor - r.goalsAgainst,
    }));

    const matchesTotal = (teamsMap.size * MATCHES_PER_TEAM) / 2;
    const isComplete = groupMatches.length >= matchesTotal;

    standings.push({
      group,
      matchesPlayed: groupMatches.length,
      matchesTotal,
      isComplete,
      rows: assignQualification(rows, isComplete),
    });
  }

  return markBestThirdPlace(standings);
}

export function getGroupStandingsForGroup(matches: Match[], group: string): GroupStandings | null {
  return buildGroupStandings(matches).find((g) => g.group === group) ?? null;
}

/** Resolve placeholder knockout names like "Group A winners". */
export function resolveKnockoutTeamName(label: string, standings: GroupStandings[]): string {
  const winners = label.match(/^Group ([A-L]) winners$/i);
  if (winners) {
    const g = standings.find((s) => s.group.toUpperCase() === winners[1].toUpperCase());
    const leader = g?.rows.find((r) => r.position === 1);
    if (g?.isComplete && leader) return leader.name;
    return label;
  }

  const runners = label.match(/^Group ([A-L]) runners-up$/i);
  if (runners) {
    const g = standings.find((s) => s.group.toUpperCase() === runners[1].toUpperCase());
    const second = g?.rows.find((r) => r.position === 2);
    if (g?.isComplete && second) return second.name;
    return label;
  }

  if (/third place/i.test(label)) return label;

  return label;
}

export function qualificationBadgeClass(status: QualificationStatus): string {
  switch (status) {
    case "qualified":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "best-third":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "possible":
      return "bg-sky-500/15 text-sky-400 border-sky-500/30";
    case "eliminated":
      return "bg-red-500/10 text-red-400/70 border-red-500/20";
    default:
      return "bg-white/5 text-white/40 border-white/10";
  }
}
