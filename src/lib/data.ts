import { createClient } from "@/lib/supabase/server";
import { getWorldCupMatches } from "@/lib/fixtures-api";
import { buildGroupStandings, type GroupStandings } from "@/lib/group-standings";
import { getRecordsSnapshot } from "@/lib/records-engine";
import { getLiveMatchViews, getFeaturedMatchView, getMatchLiveView } from "@/lib/live-matches";

export { getLiveMatchViews, getFeaturedMatchView, getMatchLiveView };
import { isUpcomingKickoff } from "@/lib/team-aliases";
import type {
  Match,
  Player,
  RecordBroken,
  RecordCreated,
  Team,
  TimelineEvent,
  TournamentStats,
} from "@/types/database";

export const REVALIDATE_SECONDS = 60;

async function fetchMatches(): Promise<Match[]> {
  return getWorldCupMatches();
}

export async function getTournamentStats(): Promise<TournamentStats | null> {
  const snapshot = await getRecordsSnapshot();
  return snapshot.stats;
}

export async function getLiveMatches(): Promise<Match[]> {
  const matches = await fetchMatches();
  return matches
    .filter((m) => m.status === "live")
    .sort((a, b) => a.match_date.localeCompare(b.match_date));
}

export async function getUpcomingMatches(limit?: number): Promise<Match[]> {
  const matches = await fetchMatches();
  const upcoming = matches
    .filter((m) => m.status === "scheduled" && isUpcomingKickoff(m.match_date))
    .sort((a, b) => a.match_date.localeCompare(b.match_date));
  return limit ? upcoming.slice(0, limit) : upcoming;
}

export async function getNextMatch(): Promise<Match | null> {
  const upcoming = await getUpcomingMatches(1);
  return upcoming[0] ?? null;
}

export async function getCompletedMatches(limit = 6): Promise<Match[]> {
  const matches = await fetchMatches();
  const completed = matches
    .filter((m) => m.status === "completed")
    .sort((a, b) => b.match_date.localeCompare(a.match_date));
  return completed.slice(0, limit);
}

export async function getAllMatches(): Promise<Match[]> {
  const matches = await fetchMatches();
  return [...matches].sort((a, b) => b.match_date.localeCompare(a.match_date));
}

export async function getMatchSchedule(): Promise<Match[]> {
  const matches = await fetchMatches();
  return [...matches].sort((a, b) => a.match_date.localeCompare(b.match_date));
}

export async function getMatch(id: string): Promise<Match | null> {
  const matches = await fetchMatches();
  return matches.find((m) => m.id === id) ?? null;
}

export async function getRecordsBroken(): Promise<RecordBroken[]> {
  const snapshot = await getRecordsSnapshot();
  return snapshot.broken;
}

export async function getRecordBroken(id: string): Promise<RecordBroken | null> {
  const snapshot = await getRecordsSnapshot();
  return snapshot.broken.find((r) => r.id === id) ?? null;
}

export async function getRecordsCreated(): Promise<RecordCreated[]> {
  const snapshot = await getRecordsSnapshot();
  return snapshot.created;
}

export async function getRecordCreated(id: string): Promise<RecordCreated | null> {
  const snapshot = await getRecordsSnapshot();
  return snapshot.created.find((r) => r.id === id) ?? null;
}

export async function getRecordChases() {
  const snapshot = await getRecordsSnapshot();
  return snapshot.chases;
}

export async function getTimelineEvents(): Promise<TimelineEvent[]> {
  const snapshot = await getRecordsSnapshot();
  return snapshot.timeline;
}

export async function getTeams(): Promise<Team[]> {
  const matches = await fetchMatches();
  const teamMap = new Map<string, Team>();

  for (const m of matches) {
    for (const side of [m.home_team, m.away_team]) {
      if (!side?.name || teamMap.has(side.name)) continue;
      teamMap.set(side.name, {
        id: side.id,
        name: side.name,
        code: side.code,
        flag_url: side.flag_url,
        group_name: side.group_name,
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        created_at: "",
        updated_at: "",
      });
    }
  }

  for (const m of matches.filter((x) => x.status === "completed")) {
    const home = m.home_team?.name;
    const away = m.away_team?.name;
    if (!home || !away) continue;
    const ht = teamMap.get(home);
    const at = teamMap.get(away);
    if (!ht || !at) continue;

    ht.matches_played += 1;
    at.matches_played += 1;
    ht.goals_for += m.home_score ?? 0;
    ht.goals_against += m.away_score ?? 0;
    at.goals_for += m.away_score ?? 0;
    at.goals_against += m.home_score ?? 0;

    if ((m.home_score ?? 0) > (m.away_score ?? 0)) {
      ht.wins += 1;
      at.losses += 1;
    } else if ((m.home_score ?? 0) < (m.away_score ?? 0)) {
      at.wins += 1;
      ht.losses += 1;
    } else {
      ht.draws += 1;
      at.draws += 1;
    }
  }

  return [...teamMap.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTeam(id: string): Promise<Team | null> {
  const teams = await getTeams();
  return teams.find((t) => t.id === id) ?? null;
}

export async function getGroupStandings(): Promise<GroupStandings[]> {
  const matches = await fetchMatches();
  return buildGroupStandings(matches);
}

export async function getTopScorers(limit = 10): Promise<Player[]> {
  const snapshot = await getRecordsSnapshot();
  return snapshot.scorers.slice(0, limit);
}

export async function getTopAssists(limit = 10): Promise<Player[]> {
  const snapshot = await getRecordsSnapshot();
  return snapshot.assisters.slice(0, limit);
}

export async function getPlayers(): Promise<Player[]> {
  const snapshot = await getRecordsSnapshot();
  return snapshot.scorers;
}

export async function getPlayer(id: string): Promise<Player | null> {
  const snapshot = await getRecordsSnapshot();
  return snapshot.scorers.find((p) => p.id === id) ?? null;
}

export async function getPlayerRecords(playerName: string) {
  const snapshot = await getRecordsSnapshot();
  const q = playerName.toLowerCase();
  return {
    broken: snapshot.broken.filter(
      (r) =>
        r.new_holder.toLowerCase().includes(q) ||
        r.previous_holder.toLowerCase().includes(q)
    ),
    created: snapshot.created.filter((r) => r.holder.toLowerCase().includes(q)),
  };
}

export async function getTeamRecords(teamName: string) {
  const snapshot = await getRecordsSnapshot();
  const q = teamName.toLowerCase();
  return {
    broken: snapshot.broken.filter(
      (r) =>
        r.new_holder.toLowerCase().includes(q) ||
        r.previous_holder.toLowerCase().includes(q)
    ),
    created: snapshot.created.filter((r) => r.holder.toLowerCase().includes(q)),
  };
}

export async function searchAll(query: string) {
  const q = query.toLowerCase();
  const [snapshot, matches, teams] = await Promise.all([
    getRecordsSnapshot(),
    fetchMatches(),
    getTeams(),
  ]);

  return {
    players: snapshot.scorers.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 10),
    teams: teams.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 10),
    matches: matches
      .filter(
        (m) =>
          m.home_team?.name.toLowerCase().includes(q) ||
          m.away_team?.name.toLowerCase().includes(q)
      )
      .slice(0, 10),
    broken: snapshot.broken.filter((r) => r.title.toLowerCase().includes(q)).slice(0, 10),
    created: snapshot.created.filter((r) => r.title.toLowerCase().includes(q)).slice(0, 10),
  };
}

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admins")
    .select("id")
    .eq("user_id", userId)
    .single();
  return !!data;
}

export async function refreshTournamentStats() {
  const supabase = await createClient();

  const [matches, goals, broken, created, teams, attendance] = await Promise.all([
    supabase.from("matches").select("id", { count: "exact" }).eq("status", "completed"),
    supabase.from("matches").select("home_score, away_score").eq("status", "completed"),
    supabase.from("records_broken").select("id", { count: "exact" }),
    supabase.from("records_created").select("id", { count: "exact" }),
    supabase.from("teams").select("id", { count: "exact" }),
    supabase.from("matches").select("attendance").not("attendance", "is", null),
  ]);

  const totalGoals = (goals.data || []).reduce(
    (sum, m) => sum + (m.home_score || 0) + (m.away_score || 0),
    0
  );
  const totalAttendance = (attendance.data || []).reduce(
    (sum, m) => sum + (m.attendance || 0),
    0
  );

  const stats = {
    matches_played: matches.count || 0,
    goals_scored: totalGoals,
    records_broken: broken.count || 0,
    records_created: created.count || 0,
    teams_participating: teams.count || 0,
    attendance_total: totalAttendance,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase.from("tournament_stats").select("id").limit(1).single();

  if (existing) {
    await supabase.from("tournament_stats").update(stats).eq("id", existing.id);
  } else {
    await supabase.from("tournament_stats").insert(stats);
  }
}
