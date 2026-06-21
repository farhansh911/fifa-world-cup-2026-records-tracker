export type ImportanceLevel = "low" | "medium" | "high" | "legendary";

export type MatchStatus = "scheduled" | "live" | "completed" | "postponed";

export type TimelineEventType =
  | "goal"
  | "record_broken"
  | "record_created"
  | "match_highlight"
  | "milestone";

export interface Team {
  id: string;
  name: string;
  code: string;
  flag_url: string | null;
  group_name: string | null;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  name: string;
  team_id: string | null;
  position: string | null;
  photo_url: string | null;
  goals: number;
  assists: number;
  minutes_played: number;
  clean_sheets: number;
  created_at: string;
  updated_at: string;
  team?: Team;
}

export interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  minute: number | null;
  stadium: string | null;
  venue: string | null;
  host_city: string | null;
  group_name: string | null;
  match_date: string;
  attendance: number | null;
  goalscorers: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
  home_team?: Team;
  away_team?: Team;
}

export interface RecordBroken {
  id: string;
  title: string;
  previous_holder: string;
  new_holder: string;
  old_value: string;
  new_value: string;
  match_id: string | null;
  importance: ImportanceLevel;
  explanation: string | null;
  event_date: string;
  created_at: string;
  updated_at: string;
  match?: Match;
}

export interface RecordCreated {
  id: string;
  title: string;
  holder: string;
  value: string;
  match_id: string | null;
  description: string | null;
  event_date: string;
  created_at: string;
  updated_at: string;
  match?: Match;
}

export interface TournamentStats {
  id: string;
  matches_played: number;
  goals_scored: number;
  records_broken: number;
  records_created: number;
  teams_participating: number;
  attendance_total: number;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  event_type: TimelineEventType;
  title: string;
  description: string | null;
  match_id: string | null;
  player_id: string | null;
  team_id: string | null;
  event_date: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  match?: Match;
  player?: Player;
  team?: Team;
}

export interface Admin {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface SearchResult {
  type: "player" | "team" | "match" | "record_broken" | "record_created";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export interface NewsletterSignup {
  id: string;
  email: string;
  created_at: string;
}

export interface FavoriteTeam {
  id: string;
  team_id: string;
  session_id: string;
  created_at: string;
}
