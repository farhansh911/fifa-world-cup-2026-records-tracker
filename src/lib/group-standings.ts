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

interface GroupMatchResult {
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
}

interface TeamSimStats {
  name: string;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

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

function miniLeagueStats(team: string, tiedTeams: string[], results: GroupMatchResult[]): TeamSimStats {
  let points = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const m of results) {
    if (!tiedTeams.includes(m.home) || !tiedTeams.includes(m.away)) continue;
    if (m.home !== team && m.away !== team) continue;

    const isHome = m.home === team;
    const gf = isHome ? m.homeGoals : m.awayGoals;
    const ga = isHome ? m.awayGoals : m.homeGoals;
    goalsFor += gf;
    goalsAgainst += ga;
    if (gf > ga) points += 3;
    else if (gf === ga) points += 1;
  }

  return { name: team, points, goalsFor, goalsAgainst };
}

function compareTeamsFifa(a: string, b: string, tiedTeams: string[], results: GroupMatchResult[]): number {
  const miniA = miniLeagueStats(a, tiedTeams, results);
  const miniB = miniLeagueStats(b, tiedTeams, results);

  if (miniA.points !== miniB.points) return miniB.points - miniA.points;

  const gdA = miniA.goalsFor - miniA.goalsAgainst;
  const gdB = miniB.goalsFor - miniB.goalsAgainst;
  if (gdA !== gdB) return gdB - gdA;

  if (miniA.goalsFor !== miniB.goalsFor) return miniB.goalsFor - miniA.goalsFor;

  const fullA = miniLeagueStats(a, [a, b], results);
  const fullB = miniLeagueStats(b, [a, b], results);
  const fullGdA = fullA.goalsFor - fullA.goalsAgainst;
  const fullGdB = fullB.goalsFor - fullB.goalsAgainst;
  if (fullGdA !== fullGdB) return fullGdB - fullGdA;

  return fullB.goalsFor - fullA.goalsFor || a.localeCompare(b);
}

function rankSimulatedTeams(stats: TeamSimStats[], results: GroupMatchResult[]): TeamSimStats[] {
  const byName = new Map(stats.map((s) => [s.name, { ...s }]));
  const names = [...byName.keys()].sort((a, b) => {
    const sa = byName.get(a)!;
    const sb = byName.get(b)!;
    if (sa.points !== sb.points) return sb.points - sa.points;
    const gdA = sa.goalsFor - sa.goalsAgainst;
    const gdB = sb.goalsFor - sb.goalsAgainst;
    if (gdA !== gdB) return gdB - gdA;
    if (sa.goalsFor !== sb.goalsFor) return sb.goalsFor - sa.goalsFor;
    return a.localeCompare(b);
  });

  const ranked: string[] = [];
  for (let i = 0; i < names.length; ) {
    let j = i + 1;
    const points = byName.get(names[i])!.points;
    while (j < names.length && byName.get(names[j])!.points === points) j++;

    const tied = names.slice(i, j);
    if (tied.length === 1) {
      ranked.push(tied[0]);
    } else {
      ranked.push(...[...tied].sort((a, b) => compareTeamsFifa(a, b, tied, results)));
    }
    i = j;
  }

  return ranked.map((name) => byName.get(name)!);
}

function applySimResult(stats: Map<string, TeamSimStats>, result: GroupMatchResult): void {
  const home = stats.get(result.home);
  const away = stats.get(result.away);
  if (!home || !away) return;

  home.goalsFor += result.homeGoals;
  home.goalsAgainst += result.awayGoals;
  away.goalsFor += result.awayGoals;
  away.goalsAgainst += result.homeGoals;

  if (result.homeGoals > result.awayGoals) home.points += 3;
  else if (result.homeGoals < result.awayGoals) away.points += 3;
  else {
    home.points += 1;
    away.points += 1;
  }
}

function buildSimStats(rows: GroupStandingRow[]): Map<string, TeamSimStats> {
  return new Map(
    rows.map((r) => [
      r.name,
      { name: r.name, points: r.points, goalsFor: r.goalsFor, goalsAgainst: r.goalsAgainst },
    ])
  );
}

function completedGroupResults(groupMatches: Match[]): GroupMatchResult[] {
  return groupMatches
    .filter((m) => m.status === "completed" && m.home_score != null && m.away_score != null)
    .map((m) => ({
      home: m.home_team!.name,
      away: m.away_team!.name,
      homeGoals: m.home_score!,
      awayGoals: m.away_score!,
    }));
}

function remainingGroupFixtures(groupMatches: Match[]): Array<{ home: string; away: string }> {
  return groupMatches
    .filter((m) => m.status !== "completed")
    .map((m) => ({ home: m.home_team!.name, away: m.away_team!.name }));
}

/** Representative 1-0 / 0-0 results — enough for qualification math. */
const SCENARIO_OUTCOMES: GroupMatchResult[] = [
  { home: "", away: "", homeGoals: 1, awayGoals: 0 },
  { home: "", away: "", homeGoals: 0, awayGoals: 0 },
  { home: "", away: "", homeGoals: 0, awayGoals: 1 },
];

function collectPossiblePositions(
  teamName: string,
  rows: GroupStandingRow[],
  groupMatches: Match[]
): Set<number> {
  const positions = new Set<number>();
  const baseResults = completedGroupResults(groupMatches);
  const remaining = remainingGroupFixtures(groupMatches);

  if (remaining.length === 0) {
    const ranked = rankSimulatedTeams([...buildSimStats(rows).values()], baseResults);
    positions.add(ranked.findIndex((t) => t.name === teamName) + 1);
    return positions;
  }

  function walk(index: number, results: GroupMatchResult[], stats: Map<string, TeamSimStats>): void {
    if (index >= remaining.length) {
      const ranked = rankSimulatedTeams([...stats.values()], results);
      const pos = ranked.findIndex((t) => t.name === teamName) + 1;
      positions.add(pos);
      return;
    }

    const fixture = remaining[index];
    for (const template of SCENARIO_OUTCOMES) {
      const nextStats = new Map([...stats.entries()].map(([k, v]) => [k, { ...v }]));
      const result: GroupMatchResult = {
        home: fixture.home,
        away: fixture.away,
        homeGoals: template.homeGoals,
        awayGoals: template.awayGoals,
      };
      applySimResult(nextStats, result);
      walk(index + 1, [...results, result], nextStats);
    }
  }

  walk(0, baseResults, buildSimStats(rows));
  return positions;
}

function canFinishInTop(row: GroupStandingRow, rows: GroupStandingRow[], groupMatches: Match[], top: number): boolean {
  const positions = collectPossiblePositions(row.name, rows, groupMatches);
  for (const pos of positions) {
    if (pos > 0 && pos <= top) return true;
  }
  return false;
}

/** True if the team is guaranteed a top-two finish (R32) even losing every remaining match. */
function hasClinchedTopTwo(row: GroupStandingRow, sorted: GroupStandingRow[]): boolean {
  if (row.position > 2) return false;
  if (row.played >= MATCHES_PER_TEAM) return row.position <= 2;

  const third = sorted[2];
  if (!third || third.teamId === row.teamId) return row.position <= 2;

  const worstCasePoints = row.points;
  const thirdMax = maxPossiblePoints(third);

  if (worstCasePoints > thirdMax) return true;

  if (worstCasePoints === thirdMax) {
    if (row.goalDifference > third.goalDifference) return true;
    if (row.goalDifference === third.goalDifference && row.goalsFor > third.goalsFor) return true;
  }

  return false;
}

function assignQualification(
  rows: GroupStandingRow[],
  isComplete: boolean,
  groupMatches: Match[]
): GroupStandingRow[] {
  const sorted = sortRows(rows).map((r, i) => ({ ...r, position: i + 1 }));

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

    const canReachTopTwo = canFinishInTop(row, rows, groupMatches, DIRECT_QUALIFIERS);
    const canReachThird = canFinishInTop(row, rows, groupMatches, 3);

    if (hasClinchedTopTwo(row, sorted)) {
      qualification = "qualified";
      qualificationLabel = "Round of 32";
    } else if (!canReachThird) {
      qualification = "eliminated";
      qualificationLabel = "Eliminated";
    } else if (canReachTopTwo) {
      qualification = "possible";
      qualificationLabel = row.position <= DIRECT_QUALIFIERS ? "Top 2" : "Can reach top 2";
    } else if (canReachThird) {
      qualification = "best-third";
      qualificationLabel = "Best 3rd place";
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

/** While groups are still playing, highlight 3rd-place teams currently in the best-eight third-placed race. */
function markLiveBestThirdPlace(groups: GroupStandings[]): GroupStandings[] {
  const thirdCandidates = groups
    .flatMap((g) =>
      g.rows.filter(
        (r) =>
          r.played > 0 &&
          !g.isComplete &&
          r.qualification !== "qualified" &&
          r.qualification !== "eliminated" &&
          (r.position === 3 || r.qualification === "best-third")
      )
    );

  if (thirdCandidates.length === 0) return groups;

  const rankedThirds = sortRows(thirdCandidates).slice(0, BEST_THIRD_SLOTS);
  const inTopEightThirds = new Set(rankedThirds.map((r) => r.teamId));

  return groups.map((g) => {
    if (g.isComplete) return g;
    return {
      ...g,
      rows: g.rows.map((row) => {
        if (row.qualification === "eliminated" || row.qualification === "qualified") return row;
        if (inTopEightThirds.has(row.teamId)) {
          return {
            ...row,
            qualification: "best-third" as const,
            qualificationLabel: "Best 3rd place",
          };
        }
        return row;
      }),
    };
  });
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

    const allGroupMatches = matches.filter(
      (m) => m.group_name === group && m.summary?.toLowerCase() === "group stage"
    );
    const groupMatches = allGroupMatches.filter((m) => m.status === "completed");

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
      rows: assignQualification(rows, isComplete, allGroupMatches),
    });
  }

  return markLiveBestThirdPlace(markBestThirdPlace(standings));
}

export function getGroupStandingsForGroup(matches: Match[], group: string): GroupStandings | null {
  return buildGroupStandings(matches).find((g) => g.group === group) ?? null;
}

/** Resolve placeholder knockout names — only when the group stage is finished. */
export function resolveKnockoutTeamName(label: string, standings: GroupStandings[]): string {
  const winners = label.match(/^Group ([A-L]) winners$/i);
  if (winners) {
    const g = standings.find((s) => s.group.toUpperCase() === winners[1].toUpperCase());
    const leader = g?.rows.find((r) => r.position === 1);
    if (leader && g?.isComplete) return leader.name;
    return label;
  }

  const runners = label.match(/^Group ([A-L]) runners-up$/i);
  if (runners) {
    const g = standings.find((s) => s.group.toUpperCase() === runners[1].toUpperCase());
    const second = g?.rows.find((r) => r.position === 2);
    if (second && g?.isComplete) return second.name;
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
