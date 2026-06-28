import type { Match } from "@/types/database";
import { formatMatchDateHeader } from "@/lib/match-timezones";

const STAGE_LABELS: Record<string, string> = {
  "round of 32": "Round of 32",
  "round of 16": "Round of 16",
  "quarter finals": "Quarter-finals",
  "semi finals": "Semi-finals",
  "third place": "Third place",
  final: "Final",
};

export function formatStageLabel(summary: string | null | undefined): string | null {
  if (!summary) return null;
  const key = summary.toLowerCase().trim();
  if (key === "group stage") return null;
  return STAGE_LABELS[key] ?? summary;
}

function parseMatchNumber(id: string): number | null {
  const n = id.replace(/^wc2026-/, "");
  const num = parseInt(n, 10);
  return Number.isNaN(num) ? null : num;
}

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
  group_name: string | null;
  stage_label: string | null;
  match_number: number | null;
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
    group_name: match.group_name ?? match.home_team?.group_name ?? null,
    stage_label: formatStageLabel(match.summary),
    match_number: parseMatchNumber(match.id),
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

function dateHeaderId(dateKey: string): string {
  return `schedule-day-${dateKey.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}

/** Live matches plus the next few upcoming fixtures for the "Next up" strip. */
export function getNextUpMatches(matches: ScheduleMatch[], limit = 4): ScheduleMatch[] {
  const now = Date.now();
  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches
    .filter(
      (m) =>
        (m.status === "scheduled" || m.status === "postponed") &&
        new Date(m.match_date).getTime() >= now - 30 * 60 * 1000
    )
    .sort((a, b) => a.match_date.localeCompare(b.match_date));

  const seen = new Set<string>();
  const nextUp: ScheduleMatch[] = [];

  for (const m of [...live, ...upcoming]) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    nextUp.push(m);
    if (nextUp.length >= limit) break;
  }

  return nextUp;
}

/** Date section id to scroll to — prefers live, then next upcoming, else today. */
export function getScheduleScrollTarget(
  matches: ScheduleMatch[],
  grouped: Record<string, ScheduleMatch[]>,
  viewerLocal: boolean
): string | null {
  const now = Date.now();
  const anchor =
    matches.find((m) => m.status === "live") ??
    matches.find(
      (m) =>
        (m.status === "scheduled" || m.status === "postponed") &&
        new Date(m.match_date).getTime() >= now
    );

  if (anchor) {
    const key = formatMatchDateHeader(anchor.match_date, anchor.host_city, viewerLocal);
    return dateHeaderId(key);
  }

  const firstFutureDate = Object.entries(grouped).find(([, dayMatches]) =>
    dayMatches.some(
      (m) =>
        m.status === "scheduled" ||
        m.status === "postponed" ||
        m.status === "live"
    )
  );

  return firstFutureDate ? dateHeaderId(firstFutureDate[0]) : null;
}

export { dateHeaderId };
