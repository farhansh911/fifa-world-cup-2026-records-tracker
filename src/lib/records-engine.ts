import { unstable_cache } from "next/cache";
import { fetchTournamentLeaders, type TournamentPlayerStat } from "@/lib/espn-stats";
import { getCachedFifaPlayerPhotos, fifaPhotoFor, type FifaPhotoCatalog } from "@/lib/fifa-player-photos";
import { getWorldCupMatches } from "@/lib/fixtures-api";
import {
  ALL_TIME_BENCHMARKS,
  careerGoalsBefore2026,
  type HistoricalBenchmark,
} from "@/lib/world-cup-benchmarks";
import type {
  ImportanceLevel,
  Match,
  Player,
  RecordBroken,
  RecordCreated,
  TimelineEvent,
  TournamentStats,
} from "@/types/database";

export interface RecordChase {
  id: string;
  benchmarkId: string;
  title: string;
  player: string;
  team: string;
  currentValue: number;
  recordValue: number;
  recordHolder: string;
  goalsAway: number;
  status: "chasing" | "tied" | "broken";
  importance: ImportanceLevel;
  explanation: string;
  tournamentGoals: number;
  careerGoals: number;
}

const NOW = () => new Date().toISOString();

function makeId(prefix: string, slug: string): string {
  return `${prefix}-${slug.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}

function careerTotal(player: TournamentPlayerStat): number {
  return careerGoalsBefore2026(player.name) + player.goals;
}

function buildCareerChases(scorers: TournamentPlayerStat[]): RecordChase[] {
  const benchmark = ALL_TIME_BENCHMARKS.find((b) => b.id === "career-goals")!;
  const second = ALL_TIME_BENCHMARKS.find((b) => b.id === "career-goals-second")!;

  const chases: RecordChase[] = [];

  for (const player of scorers) {
    const career = careerTotal(player);
    if (career < second.value - 1) continue;

    let benchmarkRef: HistoricalBenchmark = benchmark;
    if (career <= second.value && career < benchmark.value) {
      benchmarkRef = second;
    }

    const goalsAway = benchmarkRef.value - career;
    let status: RecordChase["status"] = "chasing";
    if (career > benchmarkRef.value) status = "broken";
    else if (career === benchmarkRef.value) status = "tied";

    chases.push({
      id: makeId("chase", `${player.athleteId}-${benchmarkRef.id}`),
      benchmarkId: benchmarkRef.id,
      title: benchmarkRef.title,
      player: player.name,
      team: player.team,
      currentValue: career,
      recordValue: benchmarkRef.value,
      recordHolder: benchmarkRef.holder,
      goalsAway: Math.max(0, goalsAway),
      status,
      importance: benchmarkRef.importance,
      tournamentGoals: player.goals,
      careerGoals: careerGoalsBefore2026(player.name),
      explanation:
        status === "tied"
          ? `${player.name} has ${career} World Cup goals — level with ${benchmarkRef.holder}'s mark of ${benchmarkRef.value}.`
          : status === "broken"
            ? `${player.name} passed ${benchmarkRef.holder} with ${career} career World Cup goals.`
            : `${player.name} has ${career} World Cup goals (${player.goals} at WC 2026). ${goalsAway} behind ${benchmarkRef.holder}'s record of ${benchmarkRef.value}.`,
    });
  }

  return chases.sort((a, b) => b.currentValue - a.currentValue || a.goalsAway - b.goalsAway);
}

function buildBrokenRecords(chases: RecordChase[], matches: Match[]): RecordBroken[] {
  const broken: RecordBroken[] = [];
  const completed = matches.filter((m) => m.status === "completed");

  for (const chase of chases.filter((c) => c.status === "broken")) {
    broken.push({
      id: makeId("broken", chase.id),
      title: chase.title,
      previous_holder: chase.recordHolder,
      new_holder: chase.player,
      old_value: `${chase.recordValue} goals`,
      new_value: `${chase.currentValue} goals`,
      match_id: null,
      importance: chase.importance,
      explanation: chase.explanation,
      event_date: NOW(),
      created_at: NOW(),
      updated_at: NOW(),
    });
  }

  for (const chase of chases.filter((c) => c.status === "tied" && c.benchmarkId === "career-goals")) {
    broken.push({
      id: makeId("tied", chase.player),
      title: "Equaled all-time World Cup goals record",
      previous_holder: chase.recordHolder,
      new_holder: `${chase.player} (joint with ${chase.recordHolder})`,
      old_value: `${chase.recordValue} goals`,
      new_value: `${chase.currentValue} goals`,
      match_id: null,
      importance: "legendary",
      explanation: `${chase.player} reached ${chase.currentValue} career World Cup goals — matching ${chase.recordHolder}. One more goal takes the record outright.`,
      event_date: NOW(),
      created_at: NOW(),
      updated_at: NOW(),
    });
  }

  const highScoring = completed
    .filter((m) => m.home_score != null && m.away_score != null)
    .map((m) => ({
      match: m,
      total: (m.home_score ?? 0) + (m.away_score ?? 0),
      maxTeam: Math.max(m.home_score ?? 0, m.away_score ?? 0),
    }))
    .sort((a, b) => b.total - a.total);

  const topMatch = highScoring[0];
  if (topMatch && topMatch.total >= 7) {
    const m = topMatch.match;
    broken.push({
      id: makeId("broken", `high-scoring-${m.id}`),
      title: "Highest-scoring match at World Cup 2026",
      previous_holder: "—",
      new_holder: `${m.home_team?.name} vs ${m.away_team?.name}`,
      old_value: "—",
      new_value: `${topMatch.total} goals`,
      match_id: m.id,
      importance: "medium",
      explanation: `${m.home_team?.name} ${m.home_score}–${m.away_score} ${m.away_team?.name} — the highest combined scoreline so far at this tournament.`,
      event_date: m.match_date,
      created_at: NOW(),
      updated_at: NOW(),
      match: m,
    });
  }

  const margins = completed
    .filter((m) => m.home_score != null && m.away_score != null)
    .map((m) => ({
      match: m,
      margin: Math.abs((m.home_score ?? 0) - (m.away_score ?? 0)),
      winner:
        (m.home_score ?? 0) > (m.away_score ?? 0)
          ? m.home_team?.name ?? "?"
          : m.away_team?.name ?? "?",
      scoreline: `${m.home_score}–${m.away_score}`,
    }))
    .sort((a, b) => b.margin - a.margin);

  const topMargin = margins[0];
  if (topMargin && topMargin.margin >= 4) {
    const m = topMargin.match;
    broken.push({
      id: makeId("broken", `biggest-margin-${m.id}`),
      title: "Biggest margin of victory at World Cup 2026",
      previous_holder: "—",
      new_holder: topMargin.winner,
      old_value: "—",
      new_value: `${topMargin.margin}-goal win`,
      match_id: m.id,
      importance: topMargin.margin >= 6 ? "high" : "medium",
      explanation: `${topMargin.winner} won ${m.home_team?.name} ${m.home_score}–${m.away_score} ${m.away_team?.name} — the largest winning margin so far at this World Cup.`,
      event_date: m.match_date,
      created_at: NOW(),
      updated_at: NOW(),
      match: m,
    });
  }

  const attendanceLeader = completed
    .filter((m) => m.attendance != null && m.attendance > 0)
    .sort((a, b) => (b.attendance ?? 0) - (a.attendance ?? 0))[0];

  if (attendanceLeader?.attendance) {
    broken.push({
      id: makeId("broken", `attendance-${attendanceLeader.id}`),
      title: "Largest crowd at World Cup 2026",
      previous_holder: "—",
      new_holder: attendanceLeader.stadium ?? attendanceLeader.venue ?? "Stadium",
      old_value: "—",
      new_value: attendanceLeader.attendance.toLocaleString(),
      match_id: attendanceLeader.id,
      importance: "low",
      explanation: `${attendanceLeader.home_team?.name} vs ${attendanceLeader.away_team?.name} drew ${attendanceLeader.attendance.toLocaleString()} fans — the biggest attendance recorded so far.`,
      event_date: attendanceLeader.match_date,
      created_at: NOW(),
      updated_at: NOW(),
      match: attendanceLeader,
    });
  }

  return broken.sort((a, b) => b.event_date.localeCompare(a.event_date));
}

function buildCreatedRecords(
  scorers: TournamentPlayerStat[],
  matches: Match[],
  assisters: TournamentPlayerStat[]
): RecordCreated[] {
  const created: RecordCreated[] = [];
  const fontaine = ALL_TIME_BENCHMARKS.find((b) => b.id === "single-tournament-goals")!;

  if (scorers.length > 0) {
    const leader = scorers[0];
    created.push({
      id: makeId("created", "wc2026-golden-boot-leader"),
      title: "World Cup 2026 leading scorer",
      holder: leader.name,
      value: `${leader.goals} goal${leader.goals === 1 ? "" : "s"}`,
      match_id: null,
      description: `${leader.name} (${leader.team}) leads the Golden Boot race at World Cup 2026 with ${leader.goals} goals.`,
      event_date: NOW(),
      created_at: NOW(),
      updated_at: NOW(),
    });

    if (leader.goals >= 3) {
      created.push({
        id: makeId("created", `hot-streak-${leader.athleteId}`),
        title: "World Cup 2026 scoring form",
        holder: leader.name,
        value: `${leader.goals} goals in ${leader.displayValue.match(/Matches: (\d+)/)?.[1] ?? "?"} matches`,
        match_id: null,
        description: `${leader.name} is among the standout scorers of the opening phase.`,
        event_date: NOW(),
        created_at: NOW(),
        updated_at: NOW(),
      });
    }

    for (const player of scorers.filter((p) => p.goals >= fontaine.value - 2)) {
      if (player.goals >= fontaine.value) {
        created.push({
          id: makeId("created", `fontaine-chase-${player.athleteId}`),
          title: "Single-tournament goals record within reach",
          holder: player.name,
          value: `${player.goals} goals (record: ${fontaine.value})`,
          match_id: null,
          description: `${player.name} is chasing Just Fontaine's single-World-Cup record of ${fontaine.value} goals (1958).`,
          event_date: NOW(),
          created_at: NOW(),
          updated_at: NOW(),
        });
      }
    }
  }

  const completed = matches.filter((m) => m.status === "completed");
  const totalGoals = completed.reduce(
    (sum, m) => sum + (m.home_score ?? 0) + (m.away_score ?? 0),
    0
  );

  if (totalGoals > 0) {
    created.push({
      id: makeId("created", "wc2026-goal-tally"),
      title: "World Cup 2026 goals scored so far",
      holder: "Tournament total",
      value: `${totalGoals} goals`,
      match_id: null,
      description: `${totalGoals} goals across ${completed.length} completed matches at World Cup 2026.`,
      event_date: NOW(),
      created_at: NOW(),
      updated_at: NOW(),
    });
  }

  const teamHigh = completed
    .map((m) => ({
      match: m,
      teamGoals: Math.max(m.home_score ?? 0, m.away_score ?? 0),
      teamName:
        (m.home_score ?? 0) >= (m.away_score ?? 0)
          ? m.home_team?.name ?? "?"
          : m.away_team?.name ?? "?",
    }))
    .sort((a, b) => b.teamGoals - a.teamGoals)[0];

  if (teamHigh && teamHigh.teamGoals >= 6) {
    created.push({
      id: makeId("created", `team-goals-${teamHigh.match.id}`),
      title: "Most goals by one team in a WC 2026 match",
      holder: teamHigh.teamName,
      value: `${teamHigh.teamGoals} goals`,
      match_id: teamHigh.match.id,
      description: `${teamHigh.teamName} scored ${teamHigh.teamGoals} in a single match at this World Cup.`,
      event_date: teamHigh.match.match_date,
      created_at: NOW(),
      updated_at: NOW(),
      match: teamHigh.match,
    });
  }

  if (assisters.length > 0) {
    const assistLeader = assisters[0];
    if (assistLeader.assists >= 2) {
      created.push({
        id: makeId("created", "wc2026-assist-leader"),
        title: "World Cup 2026 leading assister",
        holder: assistLeader.name,
        value: `${assistLeader.assists} assist${assistLeader.assists === 1 ? "" : "s"}`,
        match_id: null,
        description: `${assistLeader.name} (${assistLeader.team}) leads the assist chart at World Cup 2026.`,
        event_date: NOW(),
        created_at: NOW(),
        updated_at: NOW(),
      });
    }
  }

  const avgGoals =
    completed.length > 0 ? (totalGoals / completed.length).toFixed(1) : null;
  if (avgGoals && completed.length >= 5) {
    created.push({
      id: makeId("created", "wc2026-goal-rate"),
      title: "World Cup 2026 goals per match",
      holder: "Tournament average",
      value: `${avgGoals} goals/match`,
      match_id: null,
      description: `${totalGoals} goals across ${completed.length} matches — averaging ${avgGoals} goals per game.`,
      event_date: NOW(),
      created_at: NOW(),
      updated_at: NOW(),
    });
  }

  const unbeaten = completed.filter(
    (m) => m.home_score != null && m.away_score != null && m.home_score === m.away_score
  );
  if (unbeaten.length >= 3) {
    created.push({
      id: makeId("created", "wc2026-draws"),
      title: "World Cup 2026 drawn matches",
      holder: "Tournament total",
      value: `${unbeaten.length} draws`,
      match_id: null,
      description: `${unbeaten.length} matches have ended level so far at World Cup 2026.`,
      event_date: NOW(),
      created_at: NOW(),
      updated_at: NOW(),
    });
  }

  return created;
}

function buildTimeline(
  broken: RecordBroken[],
  created: RecordCreated[],
  chases: RecordChase[],
  scorers: TournamentPlayerStat[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const r of broken) {
    events.push({
      id: makeId("timeline", r.id),
      event_type: "record_broken",
      title: r.title,
      description: r.explanation,
      match_id: r.match_id,
      player_id: null,
      team_id: null,
      event_date: r.event_date,
      metadata: { new_holder: r.new_holder, new_value: r.new_value },
      created_at: NOW(),
      match: r.match,
    });
  }

  for (const r of created.slice(0, 5)) {
    events.push({
      id: makeId("timeline", r.id),
      event_type: "record_created",
      title: r.title,
      description: r.description,
      match_id: r.match_id,
      player_id: null,
      team_id: null,
      event_date: r.event_date,
      metadata: { holder: r.holder, value: r.value },
      created_at: NOW(),
      match: r.match,
    });
  }

  for (const chase of chases.filter((c) => c.status !== "chasing").slice(0, 3)) {
    events.push({
      id: makeId("timeline", chase.id),
      event_type: "milestone",
      title:
        chase.status === "tied"
          ? `${chase.player} equals ${chase.recordHolder}`
          : `${chase.player} breaks ${chase.recordHolder}'s record`,
      description: chase.explanation,
      match_id: null,
      player_id: null,
      team_id: null,
      event_date: NOW(),
      metadata: {
        careerGoals: chase.currentValue,
        record: chase.recordValue,
      },
      created_at: NOW(),
    });
  }

  for (const scorer of scorers.filter((s) => s.goals >= 2).slice(0, 5)) {
    events.push({
      id: makeId("timeline", `goals-${scorer.athleteId}`),
      event_type: "goal",
      title: `${scorer.name} — ${scorer.goals} WC 2026 goals`,
      description: `${scorer.name} (${scorer.team}) has ${scorer.goals} goals at World Cup 2026.`,
      match_id: null,
      player_id: null,
      team_id: null,
      event_date: NOW(),
      metadata: { goals: scorer.goals, team: scorer.team },
      created_at: NOW(),
    });
  }

  return events.sort((a, b) => b.event_date.localeCompare(a.event_date));
}

function scorersToPlayers(
  scorers: TournamentPlayerStat[],
  assisters: TournamentPlayerStat[],
  fifaPhotos: FifaPhotoCatalog
): Player[] {
  const assistMap = new Map(assisters.map((a) => [a.name, a.assists]));

  return scorers.map((s) => ({
    id: makeId("player", s.athleteId),
    name: s.name,
    team_id: null,
    position: null,
    photo_url: fifaPhotoFor(fifaPhotos, s.name),
    goals: s.goals,
    assists: assistMap.get(s.name) ?? 0,
    minutes_played: 0,
    clean_sheets: 0,
    created_at: NOW(),
    updated_at: NOW(),
    team: s.team
      ? {
          id: makeId("team", s.team),
          name: s.team,
          code: s.team.slice(0, 3).toUpperCase(),
          flag_url: null,
          group_name: null,
          matches_played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          created_at: NOW(),
          updated_at: NOW(),
        }
      : undefined,
  }));
}

function buildTournamentStats(
  matches: Match[],
  broken: RecordBroken[],
  created: RecordCreated[]
): TournamentStats {
  const completed = matches.filter((m) => m.status === "completed");
  const totalGoals = completed.reduce(
    (sum, m) => sum + (m.home_score ?? 0) + (m.away_score ?? 0),
    0
  );
  const totalAttendance = completed.reduce((sum, m) => sum + (m.attendance ?? 0), 0);
  const teams = new Set<string>();
  for (const m of matches) {
    if (m.home_team?.name) teams.add(m.home_team.name);
    if (m.away_team?.name) teams.add(m.away_team.name);
  }

  return {
    id: "wc2026-live",
    matches_played: completed.length,
    goals_scored: totalGoals,
    records_broken: broken.length,
    records_created: created.length,
    teams_participating: teams.size,
    attendance_total: totalAttendance,
    updated_at: NOW(),
  };
}

export interface RecordsSnapshot {
  broken: RecordBroken[];
  created: RecordCreated[];
  chases: RecordChase[];
  timeline: TimelineEvent[];
  scorers: Player[];
  assisters: Player[];
  stats: TournamentStats;
}

async function loadRecordsSnapshot(): Promise<RecordsSnapshot> {
  const [{ scorers, assisters }, matches, fifaPhotos] = await Promise.all([
    fetchTournamentLeaders(),
    getWorldCupMatches(),
    getCachedFifaPlayerPhotos(),
  ]);

  const chases = buildCareerChases(scorers);
  const broken = buildBrokenRecords(chases, matches);
  const created = buildCreatedRecords(scorers, matches, assisters);
  const timeline = buildTimeline(broken, created, chases, scorers);
  const players = scorersToPlayers(scorers, assisters, fifaPhotos);

  return {
    broken,
    created,
    chases,
    timeline,
    scorers: players,
    assisters: players
      .slice()
      .sort((a, b) => b.assists - a.assists)
      .filter((p) => p.assists > 0),
    stats: buildTournamentStats(matches, broken, created),
  };
}

export const getCachedRecordsSnapshot = unstable_cache(
  loadRecordsSnapshot,
  ["wc2026-records-v3"],
  { revalidate: 300 }
);

export async function getRecordsSnapshot(): Promise<RecordsSnapshot> {
  try {
    return await getCachedRecordsSnapshot();
  } catch (error) {
    console.error("Failed to load records snapshot:", error);
    return {
      broken: [],
      created: [],
      chases: [],
      timeline: [],
      scorers: [],
      assisters: [],
      stats: {
        id: "empty",
        matches_played: 0,
        goals_scored: 0,
        records_broken: 0,
        records_created: 0,
        teams_participating: 48,
        attendance_total: 0,
        updated_at: NOW(),
      },
    };
  }
}
