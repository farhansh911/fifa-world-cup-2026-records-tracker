import { unstable_cache } from "next/cache";
import { fetchTournamentLeaders, type TournamentPlayerStat } from "@/lib/espn-stats";
import { getCachedFifaPlayerPhotos, fifaPhotoFor, type FifaPhotoCatalog } from "@/lib/fifa-player-photos";
import { getWorldCupMatches } from "@/lib/fixtures-api";
import { buildGroupStandings, type GroupStandings } from "@/lib/group-standings";
import { teamLastGroupMatchDate } from "@/lib/bracket";
import { isFirstKnockoutQualification } from "@/lib/wc-knockout-history";
import { getCachedMatchGoalHighlights, type MatchGoalHighlights } from "@/lib/match-goal-events";
import {
  ALL_TIME_BENCHMARKS,
  careerGoalsBefore2026,
  careerAssistsBefore2026,
  resolveCanonicalPlayerName,
  wcTournamentYearsWithGoalBefore2026,
  wcTournamentsWithGoalBefore2026,
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

function latestCompletedMatchDate(matches: Match[]): string {
  const completed = matches
    .filter((m) => m.status === "completed")
    .sort((a, b) => b.match_date.localeCompare(a.match_date));
  return completed[0]?.match_date ?? NOW();
}

/** Date of the completed match when a running total first reached `threshold`. */
function thresholdCrossedMatchDate(
  matches: Match[],
  threshold: number,
  valueFromMatch: (m: Match) => number
): string {
  const completed = [...matches]
    .filter((m) => m.status === "completed")
    .sort((a, b) => a.match_date.localeCompare(b.match_date));

  let running = 0;
  for (const m of completed) {
    running += valueFromMatch(m);
    if (running >= threshold) return m.match_date;
  }
  return latestCompletedMatchDate(matches);
}

function makeId(prefix: string, slug: string): string {
  return `${prefix}-${slug.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}

const IMPORTANCE_RANK: Record<ImportanceLevel, number> = {
  legendary: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/** Higher = more likely to appear first when dates tie. Player milestones beat generic tallies. */
function recordHighlightScore(id: string): number {
  if (/six-wc-goals|broken-chase-tournaments|first-knockout/.test(id)) {
    return 100;
  }
  if (/tied-wc-tournaments|hattrick|fastest-goal|most-goals-one/.test(id)) {
    return 60;
  }
  if (/broken-chase|broken-tied|four-goal|hattrick-broken/.test(id)) {
    return 90;
  }
  if (/golden-boot|hot-streak|fontaine-chase|watch-|assist-leader|milestone-goals/.test(id)) {
    return 40;
  }
  if (/wc2026-goal-tally|tournament-goals|tournament-matches|goal-rate|wc2026-draws|team-goals-/.test(id)) {
    return 10;
  }
  return 50;
}

export function isCareerGoalsRecord(record: RecordBroken): boolean {
  return record.title === "Most FIFA World Cup goals (all-time)";
}

function sortBrokenRecords(records: RecordBroken[]): RecordBroken[] {
  return [...records].sort((a, b) => {
    const aCareer = isCareerGoalsRecord(a) ? 1 : 0;
    const bCareer = isCareerGoalsRecord(b) ? 1 : 0;
    if (aCareer !== bCareer) return bCareer - aCareer;

    const byDate = b.event_date.localeCompare(a.event_date);
    if (byDate !== 0) return byDate;
    const byImportance =
      (IMPORTANCE_RANK[b.importance] ?? 0) - (IMPORTANCE_RANK[a.importance] ?? 0);
    if (byImportance !== 0) return byImportance;
    return recordHighlightScore(b.id) - recordHighlightScore(a.id);
  });
}

function sortCreatedRecords(records: RecordCreated[]): RecordCreated[] {
  return [...records].sort((a, b) => {
    const byDate = b.event_date.localeCompare(a.event_date);
    if (byDate !== 0) return byDate;
    return recordHighlightScore(b.id) - recordHighlightScore(a.id);
  });
}

function latestGoalMatchDate(
  playerName: string,
  highlights: MatchGoalHighlights
): string | null {
  const canonical = resolveCanonicalPlayerName(playerName).toLowerCase();
  let latest: string | null = null;

  for (const match of highlights.matches) {
    for (const entry of match.playerGoals.values()) {
      const name = resolveCanonicalPlayerName(entry.player).toLowerCase();
      if (name === canonical || name.includes(canonical) || canonical.includes(name)) {
        if (!latest || match.matchDate.localeCompare(latest) > 0) {
          latest = match.matchDate;
        }
      }
    }
  }

  return latest;
}

function careerTotal(player: TournamentPlayerStat): number {
  return careerGoalsBefore2026(player.name) + player.goals;
}

function buildCareerChases(scorers: TournamentPlayerStat[]): RecordChase[] {
  const benchmark = ALL_TIME_BENCHMARKS.find((b) => b.id === "career-goals")!;
  const second = ALL_TIME_BENCHMARKS.find((b) => b.id === "career-goals-second")!;
  const CLOSE_CHASE_GAP = 5;

  type Entry = {
    player: TournamentPlayerStat;
    career: number;
    chase: RecordChase;
  };

  const entries: Entry[] = [];

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

    entries.push({
      player,
      career,
      chase: {
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
      },
    });
  }

  const maxCareer = entries.reduce((max, entry) => Math.max(max, entry.career), 0);
  const recordSurpassed = maxCareer > benchmark.value;
  const leaderNames = entries
    .filter((entry) => entry.career === maxCareer)
    .map((entry) => entry.player.name);
  const chases: RecordChase[] = [];

  for (const entry of entries) {
    if (recordSurpassed) {
      if (entry.career === maxCareer) {
        chases.push({
          ...entry.chase,
          benchmarkId: benchmark.id,
          title: benchmark.title,
          recordValue: maxCareer,
          recordHolder: benchmark.holder,
          goalsAway: 0,
          status: "broken",
          explanation: `${entry.player.name} holds the all-time World Cup goals record with ${maxCareer} career goals — surpassing ${benchmark.holder}'s mark of ${benchmark.value}.`,
        });
        continue;
      }

      const goalsAway = maxCareer - entry.career;
      if (goalsAway > CLOSE_CHASE_GAP) continue;

      chases.push({
        ...entry.chase,
        benchmarkId: benchmark.id,
        title: benchmark.title,
        currentValue: entry.career,
        recordValue: maxCareer,
        recordHolder: leaderNames.join(" / "),
        goalsAway,
        status: "chasing",
        explanation: `${entry.player.name} has ${entry.career} World Cup goals (${entry.player.goals} at WC 2026). ${goalsAway} behind ${leaderNames[0]}'s mark of ${maxCareer}.`,
      });
      continue;
    }

    chases.push(entry.chase);
  }

  const statusRank: Record<RecordChase["status"], number> = { broken: 0, tied: 1, chasing: 2 };

  return chases.sort(
    (a, b) =>
      statusRank[a.status] - statusRank[b.status] ||
      b.currentValue - a.currentValue ||
      a.goalsAway - b.goalsAway
  );
}

export function pickCareerGoalsRace(
  chases: RecordChase[],
  broken: RecordBroken[]
): {
  holder: RecordChase | null;
  chasers: RecordChase[];
  brokenRecord: RecordBroken | null;
} {
  const careerChases = chases.filter((c) => c.benchmarkId === "career-goals");
  const holder = careerChases.find((c) => c.status === "broken") ?? null;
  const chasers = careerChases
    .filter((c) => c.status === "chasing")
    .sort((a, b) => b.currentValue - a.currentValue);
  const brokenRecord = broken.find(isCareerGoalsRecord) ?? null;

  return { holder, chasers, brokenRecord };
}

function buildSingleTournamentChases(scorers: TournamentPlayerStat[]): RecordChase[] {
  const fontaine = ALL_TIME_BENCHMARKS.find((b) => b.id === "single-tournament-goals")!;
  const chases: RecordChase[] = [];

  for (const player of scorers) {
    if (player.goals < fontaine.value - 3) continue;

    const goalsAway = fontaine.value - player.goals;
    let status: RecordChase["status"] = "chasing";
    if (player.goals > fontaine.value) status = "broken";
    else if (player.goals === fontaine.value) status = "tied";

    chases.push({
      id: makeId("chase-tournament", `${player.athleteId}-fontaine`),
      benchmarkId: fontaine.id,
      title: fontaine.title,
      player: player.name,
      team: player.team,
      currentValue: player.goals,
      recordValue: fontaine.value,
      recordHolder: fontaine.holder,
      goalsAway: Math.max(0, goalsAway),
      status,
      importance: fontaine.importance,
      tournamentGoals: player.goals,
      careerGoals: careerGoalsBefore2026(player.name),
      explanation:
        status === "broken"
          ? `${player.name} scored ${player.goals} goals at World Cup 2026 — passing Just Fontaine's single-tournament record of ${fontaine.value} (1958).`
          : status === "tied"
            ? `${player.name} has ${player.goals} goals at WC 2026 — level with Fontaine's record of ${fontaine.value}.`
            : `${player.name} has ${player.goals} goals at WC 2026. ${goalsAway} behind Fontaine's record of ${fontaine.value}.`,
    });
  }

  return chases.sort((a, b) => b.currentValue - a.currentValue);
}

function buildAssistChases(assisters: TournamentPlayerStat[]): RecordChase[] {
  const benchmark = ALL_TIME_BENCHMARKS.find((b) => b.id === "career-assists")!;
  const chases: RecordChase[] = [];

  for (const player of assisters) {
    const career = careerAssistsBefore2026(player.name) + player.assists;
    if (career < benchmark.value - 2) continue;

    const away = benchmark.value - career;
    let status: RecordChase["status"] = "chasing";
    if (career > benchmark.value) status = "broken";
    else if (career === benchmark.value) status = "tied";

    chases.push({
      id: makeId("chase-assists", player.athleteId),
      benchmarkId: benchmark.id,
      title: benchmark.title,
      player: player.name,
      team: player.team,
      currentValue: career,
      recordValue: benchmark.value,
      recordHolder: benchmark.holder,
      goalsAway: Math.max(0, away),
      status,
      importance: benchmark.importance,
      tournamentGoals: player.assists,
      careerGoals: careerAssistsBefore2026(player.name),
      explanation:
        status === "broken"
          ? `${player.name} has ${career} career World Cup assists — passing ${benchmark.holder}'s record of ${benchmark.value}.`
          : status === "tied"
            ? `${player.name} has ${career} career World Cup assists — level with ${benchmark.holder}.`
            : `${player.name} has ${career} career World Cup assists (${player.assists} at WC 2026). ${away} behind ${benchmark.holder}'s record.`,
    });
  }

  return chases;
}

function formatTournamentYears(years: number[]): string {
  return years.join(", ");
}

function buildMultiTournamentScoringRecords(
  scorers: TournamentPlayerStat[],
  highlights: MatchGoalHighlights
): {
  broken: RecordBroken[];
  created: RecordCreated[];
  chases: RecordChase[];
} {
  const benchmark = ALL_TIME_BENCHMARKS.find((b) => b.id === "tournaments-with-goal")!;
  const broken: RecordBroken[] = [];
  const created: RecordCreated[] = [];

  type Entry = {
    player: TournamentPlayerStat;
    total: number;
    status: RecordChase["status"];
    yearList: string;
    explanation: string;
    eventDate: string;
    chase: RecordChase;
  };

  const entries: Entry[] = [];

  for (const player of scorers) {
    if (player.goals <= 0) continue;

    const previousYears = wcTournamentYearsWithGoalBefore2026(player.name);
    if (previousYears.length === 0) continue;

    const allYears = [...previousYears, 2026];
    const total = allYears.length;
    if (total < benchmark.value - 1) continue;

    const away = benchmark.value - total;
    let status: RecordChase["status"] = "chasing";
    if (total > benchmark.value) status = "broken";
    else if (total === benchmark.value) status = "tied";

    const yearList = formatTournamentYears(allYears);
    const explanation =
      status === "broken"
        ? `${player.name} scored at World Cup 2026 — the first player to find the net in ${total} different FIFA World Cup tournaments (${yearList}).`
        : status === "tied"
          ? `${player.name} scored at World Cup 2026 — joining the select group to score in ${total} World Cup editions (${yearList}).`
          : `${player.name} has scored in ${total} World Cup tournaments (${yearList}). ${away} edition${away === 1 ? "" : "s"} behind the record of ${benchmark.value}.`;

    const chase: RecordChase = {
      id: makeId("chase-tournaments", player.athleteId),
      benchmarkId: benchmark.id,
      title: benchmark.title,
      player: player.name,
      team: player.team,
      currentValue: total,
      recordValue: benchmark.value,
      recordHolder: benchmark.holder,
      goalsAway: Math.max(0, away),
      status,
      importance: benchmark.importance,
      tournamentGoals: player.goals,
      careerGoals: careerGoalsBefore2026(player.name) + player.goals,
      explanation,
    };

    entries.push({
      player,
      total,
      status,
      yearList,
      explanation,
      eventDate: latestGoalMatchDate(player.name, highlights) ?? NOW(),
      chase,
    });
  }

  const maxTotal = entries.reduce((max, entry) => Math.max(max, entry.total), 0);
  const recordSurpassed = maxTotal > benchmark.value;
  const leaderNames = entries
    .filter((entry) => entry.total === maxTotal && entry.status === "broken")
    .map((entry) => entry.player.name);
  const chases: RecordChase[] = [];

  for (const entry of entries) {
    // Once someone passes the old mark (e.g. Ronaldo at 6), tying the previous best (5) is not a new record.
    if (recordSurpassed && entry.status !== "broken") continue;

    const chase: RecordChase = recordSurpassed
      ? {
          ...entry.chase,
          recordValue: maxTotal,
          recordHolder: leaderNames.join(" / ") || entry.player.name,
          goalsAway: Math.max(0, maxTotal - entry.total),
          status: entry.total === maxTotal ? "broken" : "chasing",
        }
      : entry.chase;

    if (recordSurpassed && entry.total < maxTotal) continue;

    chases.push(chase);

    if (entry.status === "broken") {
      broken.push({
        id: makeId("broken", entry.chase.id),
        title: benchmark.title,
        previous_holder: benchmark.holder,
        new_holder: entry.player.name,
        old_value: `${benchmark.value} tournaments`,
        new_value: `${entry.total} tournaments (${entry.yearList})`,
        match_id: null,
        importance: benchmark.importance,
        explanation: entry.explanation,
        event_date: entry.eventDate,
        created_at: NOW(),
        updated_at: NOW(),
      });

      created.push({
        id: makeId("created", `six-wc-goals-${entry.player.athleteId}`),
        title: `First player to score in ${entry.total} World Cups`,
        holder: entry.player.name,
        value: `${entry.total} tournaments (${entry.yearList})`,
        match_id: null,
        description: entry.explanation,
        event_date: entry.eventDate,
        created_at: NOW(),
        updated_at: NOW(),
      });
    } else if (entry.status === "tied") {
      created.push({
        id: makeId("created", `tied-wc-tournaments-${entry.player.athleteId}`),
        title: `Scored in ${entry.total} World Cup tournaments`,
        holder: entry.player.name,
        value: `${entry.total} editions (${entry.yearList})`,
        match_id: null,
        description: entry.explanation,
        event_date: entry.eventDate,
        created_at: NOW(),
        updated_at: NOW(),
      });
    }
  }

  const statusRank: Record<RecordChase["status"], number> = { broken: 0, tied: 1, chasing: 2 };

  return {
    broken,
    created,
    chases: chases.sort(
      (a, b) =>
        statusRank[a.status] - statusRank[b.status] ||
        b.currentValue - a.currentValue ||
        a.goalsAway - b.goalsAway
    ),
  };
}

function buildBrokenRecords(
  chases: RecordChase[],
  tournamentChases: RecordChase[],
  assistChases: RecordChase[],
  matches: Match[],
  highlights: MatchGoalHighlights
): RecordBroken[] {
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
      event_date: latestGoalMatchDate(chase.player, highlights) ?? latestCompletedMatchDate(matches),
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
      event_date: latestGoalMatchDate(chase.player, highlights) ?? latestCompletedMatchDate(matches),
      created_at: NOW(),
      updated_at: NOW(),
    });
  }

  for (const chase of [...tournamentChases, ...assistChases].filter((c) => c.status === "broken" || c.status === "tied")) {
    broken.push({
      id: makeId("broken", chase.id),
      title: chase.status === "tied" ? `Equaled: ${chase.title}` : chase.title,
      previous_holder: chase.recordHolder,
      new_holder: chase.status === "tied" ? `${chase.player} (joint with ${chase.recordHolder})` : chase.player,
      old_value: `${chase.recordValue}`,
      new_value: `${chase.currentValue}`,
      match_id: null,
      importance: chase.importance,
      explanation: chase.explanation,
      event_date: latestGoalMatchDate(chase.player, highlights) ?? latestCompletedMatchDate(matches),
      created_at: NOW(),
      updated_at: NOW(),
    });
  }

  const teamGoalsBenchmark = ALL_TIME_BENCHMARKS.find((b) => b.id === "team-goals-match")!;
  const matchTotalBenchmark = ALL_TIME_BENCHMARKS.find((b) => b.id === "match-total-goals")!;
  const marginBenchmark = ALL_TIME_BENCHMARKS.find((b) => b.id === "biggest-margin")!;

  const highScoring = completed
    .filter((m) => m.home_score != null && m.away_score != null)
    .map((m) => ({
      match: m,
      total: (m.home_score ?? 0) + (m.away_score ?? 0),
      maxTeam: Math.max(m.home_score ?? 0, m.away_score ?? 0),
    }))
    .sort((a, b) => b.total - a.total);

  const topMatch = highScoring[0];
  if (topMatch && topMatch.total >= 5) {
    const m = topMatch.match;
    const isAllTime = topMatch.total >= matchTotalBenchmark.value;
    broken.push({
      id: makeId("broken", `high-scoring-${m.id}`),
      title: isAllTime
        ? "All-time record: most goals in a World Cup match"
        : "Highest-scoring match at World Cup 2026",
      previous_holder: isAllTime ? matchTotalBenchmark.holder : "—",
      new_holder: `${m.home_team?.name} vs ${m.away_team?.name}`,
      old_value: isAllTime ? `${matchTotalBenchmark.value} goals` : "—",
      new_value: `${topMatch.total} goals`,
      match_id: m.id,
      importance: isAllTime ? "legendary" : topMatch.total >= 7 ? "medium" : "low",
      explanation: `${m.home_team?.name} ${m.home_score}–${m.away_score} ${m.away_team?.name} — ${topMatch.total} combined goals${isAllTime ? ", breaking the all-time World Cup match record." : " — the highest scoreline so far at WC 2026."}`,
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
  if (topMargin && topMargin.margin >= 3) {
    const m = topMargin.match;
    const isAllTime = topMargin.margin >= marginBenchmark.value;
    broken.push({
      id: makeId("broken", `biggest-margin-${m.id}`),
      title: isAllTime
        ? "All-time record: biggest margin of victory at a World Cup"
        : "Biggest margin of victory at World Cup 2026",
      previous_holder: isAllTime ? marginBenchmark.holder : "—",
      new_holder: topMargin.winner,
      old_value: isAllTime ? `${marginBenchmark.value}-goal margin` : "—",
      new_value: `${topMargin.margin}-goal win`,
      match_id: m.id,
      importance: isAllTime ? "legendary" : topMargin.margin >= 6 ? "high" : "medium",
      explanation: `${topMargin.winner} won ${m.home_team?.name} ${m.home_score}–${m.away_score} ${m.away_team?.name} — a ${topMargin.margin}-goal margin${isAllTime ? ", matching or exceeding the all-time World Cup record." : " — the largest so far at WC 2026."}`,
      event_date: m.match_date,
      created_at: NOW(),
      updated_at: NOW(),
      match: m,
    });
  }

  for (const m of completed) {
    const home = m.home_score ?? 0;
    const away = m.away_score ?? 0;
    const maxTeam = Math.max(home, away);
    if (maxTeam >= teamGoalsBenchmark.value) {
      const teamName = home >= away ? m.home_team?.name : m.away_team?.name;
      broken.push({
        id: makeId("broken", `team-goals-alltime-${m.id}`),
        title: "All-time record: most goals by one team in a World Cup match",
        previous_holder: teamGoalsBenchmark.holder,
        new_holder: teamName ?? "?",
        old_value: `${teamGoalsBenchmark.value} goals`,
        new_value: `${maxTeam} goals`,
        match_id: m.id,
        importance: "legendary",
        explanation: `${teamName} scored ${maxTeam} in ${m.home_team?.name} ${home}–${away} ${m.away_team?.name} — equaling or breaking the all-time World Cup record.`,
        event_date: m.match_date,
        created_at: NOW(),
        updated_at: NOW(),
        match: m,
      });
    }
  }

  for (const ht of highlights.hatTricks.filter((h) => h.goals >= 4)) {
    broken.push({
      id: makeId("broken", `haul-${ht.player}-${ht.espnEventId}`),
      title: "Four or more goals in a World Cup match",
      previous_holder: "Just Fontaine / others",
      new_holder: ht.player,
      old_value: "4 goals (extremely rare)",
      new_value: `${ht.goals} goals`,
      match_id: null,
      importance: "legendary",
      explanation: `${ht.player} (${ht.team}) scored ${ht.goals} goals in ${ht.homeTeam} vs ${ht.awayTeam} — one of the greatest individual World Cup performances ever.`,
      event_date: ht.matchDate,
      created_at: NOW(),
      updated_at: NOW(),
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
  assisters: TournamentPlayerStat[],
  highlights: MatchGoalHighlights,
  tournamentChases: RecordChase[]
): RecordCreated[] {
  const created: RecordCreated[] = [];
  const fontaine = ALL_TIME_BENCHMARKS.find((b) => b.id === "single-tournament-goals")!;
  const completed = matches.filter((m) => m.status === "completed");
  const latestMatchDate = latestCompletedMatchDate(matches);

  if (scorers.length > 0) {
    const leader = scorers[0];
    const leaderGoalDate = latestGoalMatchDate(leader.name, highlights) ?? latestMatchDate;
    created.push({
      id: makeId("created", "wc2026-golden-boot-leader"),
      title: "World Cup 2026 leading scorer",
      holder: leader.name,
      value: `${leader.goals} goal${leader.goals === 1 ? "" : "s"}`,
      match_id: null,
      description: `${leader.name} (${leader.team}) leads the Golden Boot race at World Cup 2026 with ${leader.goals} goals.`,
      event_date: leaderGoalDate,
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
        event_date: leaderGoalDate,
        created_at: NOW(),
        updated_at: NOW(),
      });
    }

    for (const player of scorers.filter((p) => p.goals >= fontaine.value - 2)) {
      if (player.goals >= fontaine.value) continue;
      created.push({
        id: makeId("created", `fontaine-chase-${player.athleteId}`),
        title: "Chasing Fontaine's single-tournament record",
        holder: player.name,
        value: `${player.goals} goals (${fontaine.value - player.goals} behind record)`,
        match_id: null,
        description: `${player.name} is chasing Just Fontaine's single-World-Cup record of ${fontaine.value} goals (1958).`,
        event_date: latestGoalMatchDate(player.name, highlights) ?? latestMatchDate,
        created_at: NOW(),
        updated_at: NOW(),
      });
    }

    for (const player of scorers.filter((p) => [5, 7, 10].includes(p.goals))) {
      created.push({
        id: makeId("created", `milestone-goals-${player.athleteId}-${player.goals}`),
        title: `${player.goals} goals at World Cup 2026`,
        holder: player.name,
        value: `${player.goals} tournament goals`,
        match_id: null,
        description: `${player.name} (${player.team}) reached ${player.goals} goals at this World Cup — a major scoring milestone.`,
        event_date: latestGoalMatchDate(player.name, highlights) ?? latestMatchDate,
        created_at: NOW(),
        updated_at: NOW(),
      });
    }
  }

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
      event_date: latestMatchDate,
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

  if (teamHigh && teamHigh.teamGoals >= 3) {
    created.push({
      id: makeId("created", `team-goals-${teamHigh.match.id}`),
      title: "Most goals by one team in a WC 2026 match",
      holder: teamHigh.teamName,
      value: `${teamHigh.teamGoals} goals`,
      match_id: teamHigh.match.id,
      description: `${teamHigh.teamName} scored ${teamHigh.teamGoals} in a single match — the most by any team at this World Cup so far.`,
      event_date: teamHigh.match.match_date,
      created_at: NOW(),
      updated_at: NOW(),
      match: teamHigh.match,
    });
  }

  for (const ht of highlights.hatTricks) {
    created.push({
      id: makeId("created", `hattrick-${ht.player}-${ht.espnEventId}`),
      title: ht.goals >= 4 ? "Four-goal haul at World Cup 2026" : "Hat-trick at World Cup 2026",
      holder: ht.player,
      value: `${ht.goals} goals in one match`,
      match_id: null,
      description: `${ht.player} (${ht.team}) scored ${ht.goals} goals in ${ht.homeTeam} vs ${ht.awayTeam}.`,
      event_date: ht.matchDate,
      created_at: NOW(),
      updated_at: NOW(),
    });
  }

  if (highlights.fastestGoal) {
    const fg = highlights.fastestGoal;
    created.push({
      id: makeId("created", "wc2026-fastest-goal"),
      title: "Fastest goal at World Cup 2026",
      holder: fg.player,
      value: `${fg.minute}'`,
      match_id: null,
      description: `${fg.player} (${fg.team}) scored after ${fg.minute} minutes in ${fg.homeTeam} vs ${fg.awayTeam} — the quickest goal of the tournament so far.`,
      event_date: fg.matchDate,
      created_at: NOW(),
      updated_at: NOW(),
    });
  }

  if (highlights.maxPlayerGoalsInMatch && highlights.maxPlayerGoalsInMatch.goals >= 2) {
    const mp = highlights.maxPlayerGoalsInMatch;
    created.push({
      id: makeId("created", "wc2026-most-goals-one-match"),
      title: "Most goals by one player in a WC 2026 match",
      holder: mp.player,
      value: `${mp.goals} goals`,
      match_id: null,
      description: `${mp.player} (${mp.team}) scored ${mp.goals} in ${mp.homeTeam} vs ${mp.awayTeam} — the best individual match return so far.`,
      event_date: mp.matchDate,
      created_at: NOW(),
      updated_at: NOW(),
    });
  }

  for (const milestone of [50, 100, 150, 200]) {
    if (totalGoals >= milestone) {
      created.push({
        id: makeId("created", `tournament-goals-${milestone}`),
        title: `${milestone} goals reached at World Cup 2026`,
        holder: "Tournament milestone",
        value: `${totalGoals} total goals`,
        match_id: null,
        description: `World Cup 2026 has passed ${milestone} total goals across ${completed.length} completed matches.`,
        event_date: thresholdCrossedMatchDate(matches, milestone, (m) => (m.home_score ?? 0) + (m.away_score ?? 0)),
        created_at: NOW(),
        updated_at: NOW(),
      });
    }
  }

  for (const milestone of [25, 50, 75, 100]) {
    if (completed.length >= milestone) {
      created.push({
        id: makeId("created", `tournament-matches-${milestone}`),
        title: `${milestone} matches completed at World Cup 2026`,
        holder: "Tournament milestone",
        value: `${completed.length} matches played`,
        match_id: null,
        description: `${completed.length} matches have been completed at World Cup 2026.`,
        event_date: thresholdCrossedMatchDate(matches, milestone, () => 1),
        created_at: NOW(),
        updated_at: NOW(),
      });
    }
  }

  for (const chase of tournamentChases.filter((c) => c.status === "chasing" && c.goalsAway <= 3)) {
    created.push({
      id: makeId("created", `watch-${chase.id}`),
      title: "Record watch: single-tournament goals",
      holder: chase.player,
      value: `${chase.currentValue} goals (${chase.goalsAway} to record)`,
      match_id: null,
      description: chase.explanation,
      event_date: latestGoalMatchDate(chase.player, highlights) ?? latestMatchDate,
      created_at: NOW(),
      updated_at: NOW(),
    });
  }

  if (assisters.length > 0) {
    const assistLeader = assisters[0];
    if (assistLeader.assists >= 1) {
      created.push({
        id: makeId("created", "wc2026-assist-leader"),
        title: "World Cup 2026 leading assister",
        holder: assistLeader.name,
        value: `${assistLeader.assists} assist${assistLeader.assists === 1 ? "" : "s"}`,
        match_id: null,
        description: `${assistLeader.name} (${assistLeader.team}) leads the assist chart at World Cup 2026.`,
        event_date: latestMatchDate,
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
      event_date: latestMatchDate,
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
      event_date: latestMatchDate,
      created_at: NOW(),
      updated_at: NOW(),
    });
  }

  return created;
}

function buildFirstKnockoutQualificationRecords(
  groups: GroupStandings[],
  matches: Match[]
): RecordCreated[] {
  const created: RecordCreated[] = [];

  for (const g of groups) {
    if (!g.isComplete) continue;
    for (const row of g.rows) {
      if (row.qualification !== "qualified") continue;
      if (!isFirstKnockoutQualification(row.name)) continue;

      const clinchDate =
        teamLastGroupMatchDate(row.name, g.group, matches) ?? latestCompletedMatchDate(matches);

      const viaThird = row.qualificationLabel.toLowerCase().includes("3rd");
      const pathLabel = viaThird ? "as one of the best third-placed teams" : `as Group ${g.group} ${row.position === 1 ? "winners" : "runners-up"}`;

      created.push({
        id: makeId("created", `first-knockout-${row.code}-${g.group}`),
        title: "First World Cup knockout appearance",
        holder: row.name,
        value: "Round of 32",
        match_id: null,
        description: `${row.name} qualified for the Round of 32 at World Cup 2026 ${pathLabel} — the nation's first ever appearance in the World Cup knockout stage.`,
        event_date: clinchDate,
        created_at: NOW(),
        updated_at: NOW(),
      });
    }
  }

  return created;
}

function buildTimeline(
  broken: RecordBroken[],
  created: RecordCreated[],
  chases: RecordChase[],
  tournamentChases: RecordChase[],
  assistChases: RecordChase[],
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

  for (const r of created.slice(0, 12)) {
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

  for (const chase of [...chases, ...tournamentChases, ...assistChases]
    .filter((c) => c.status === "chasing" && c.goalsAway <= 2)
    .slice(0, 5)) {
    events.push({
      id: makeId("timeline", `watch-${chase.id}`),
      event_type: "milestone",
      title: `Record watch: ${chase.player}`,
      description: chase.explanation,
      match_id: null,
      player_id: null,
      team_id: null,
      event_date: NOW(),
      metadata: { goalsAway: chase.goalsAway, record: chase.recordValue },
      created_at: NOW(),
    });
  }

  for (const chase of [...chases, ...tournamentChases, ...assistChases]
    .filter((c) => c.status !== "chasing")
    .slice(0, 5)) {
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
  const [{ scorers, assisters }, matches, fifaPhotos, highlights] = await Promise.all([
    fetchTournamentLeaders(),
    getWorldCupMatches(),
    getCachedFifaPlayerPhotos(),
    getCachedMatchGoalHighlights(),
  ]);

  const chases = buildCareerChases(scorers);
  const tournamentChases = buildSingleTournamentChases(scorers);
  const assistChases = buildAssistChases(assisters);
  const multiTournament = buildMultiTournamentScoringRecords(scorers, highlights);
  const groups = buildGroupStandings(matches);
  const allChases = [...chases, ...tournamentChases, ...assistChases, ...multiTournament.chases];
  const broken = sortBrokenRecords([
    ...buildBrokenRecords(chases, tournamentChases, assistChases, matches, highlights),
    ...multiTournament.broken,
  ]);
  const created = sortCreatedRecords([
    ...buildCreatedRecords(scorers, matches, assisters, highlights, tournamentChases),
    ...multiTournament.created,
    ...buildFirstKnockoutQualificationRecords(groups, matches),
  ]);
  const timeline = buildTimeline(broken, created, [...chases, ...multiTournament.chases], tournamentChases, assistChases, scorers);
  const players = scorersToPlayers(scorers, assisters, fifaPhotos);

  return {
    broken,
    created,
    chases: allChases,
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
  ["wc2026-records-v10"],
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
