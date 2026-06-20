import type { Match } from "@/types/database";
import { formatMatchDateHeader } from "@/lib/match-timezones";

export interface ScheduleMatch {
  id: string;
  home: { name: string; code: string; flag_url: string | null };
  away: { name: string; code: string; flag_url: string | null };
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "live" | "completed" | "postponed";
  minute: number | null;
  match_date: string;
  host_city: string | null;
  stadium: string | null;
  venue: string | null;
}

export function toScheduleMatch(match: Match): ScheduleMatch {
  return {
    id: match.id,
    home: {
      name: match.home_team?.name ?? "TBD",
      code: match.home_team?.code ?? "?",
      flag_url: match.home_team?.flag_url ?? null,
    },
    away: {
      name: match.away_team?.name ?? "TBD",
      code: match.away_team?.code ?? "?",
      flag_url: match.away_team?.flag_url ?? null,
    },
    home_score: match.home_score,
    away_score: match.away_score,
    status: match.status,
    minute: match.minute,
    match_date: match.match_date,
    host_city: match.host_city ?? null,
    stadium: match.stadium,
    venue: match.venue,
  };
}

export function groupMatchesByDate(
  matches: ScheduleMatch[],
  viewerLocal = false
): Record<string, ScheduleMatch[]> {
  const sorted = [...matches].sort((a, b) => a.match_date.localeCompare(b.match_date));
  return sorted.reduce<Record<string, ScheduleMatch[]>>((acc, match) => {
    const dateKey = formatMatchDateHeader(match.match_date, match.host_city, viewerLocal);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(match);
    return acc;
  }, {});
}
