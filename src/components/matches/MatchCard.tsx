"use client";

import Link from "next/link";
import { formatScoreLine } from "@/lib/team-aliases";
import { cn, getStatusColor } from "@/lib/utils";
import { MatchKickoffTime } from "@/components/matches/MatchKickoffTime";
import { GroupBadge } from "@/components/matches/GroupBadge";
import { useLiveMatchOverlay } from "@/components/providers/LiveScoresProvider";
import { Badge } from "@/components/ui/Badge";
import { TeamFlag } from "@/components/matches/TeamFlag";
import type { Match } from "@/types/database";

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const overlay = useLiveMatchOverlay(match.id);

  const status = overlay?.status ?? match.status;
  const homeScore = overlay?.home.score ?? match.home_score;
  const awayScore = overlay?.away.score ?? match.away_score;
  const minute = overlay?.minute ?? match.minute;
  const isLive = status === "live";
  const isScheduled = status === "scheduled" || status === "postponed";
  const isCompleted = status === "completed";
  const scoreLine = formatScoreLine(status, homeScore, awayScore);
  const group = match.group_name ?? match.home_team?.group_name;
  const goalLine =
    overlay && overlay.goals.length > 0
      ? overlay.goals.map((g) => `${g.player} ${g.minute}'`).join(" · ")
      : match.goalscorers;

  const home = {
    name: match.home_team?.name ?? "TBD",
    code: match.home_team?.code ?? "?",
    flag_url: match.home_team?.flag_url ?? null,
  };
  const away = {
    name: match.away_team?.name ?? "TBD",
    code: match.away_team?.code ?? "?",
    flag_url: match.away_team?.flag_url ?? null,
  };

  return (
    <Link href={`/matches/${match.id}`} className="block group min-w-0">
      <article className={cn("card card-hover p-3.5 sm:p-4 min-w-0", isLive && "border-red-500/30")}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant={isLive ? "live" : "default"} className={getStatusColor(status)}>
              {isLive && minute != null ? `${minute}'` : isScheduled ? "Upcoming" : isCompleted ? "FT" : status}
            </Badge>
            <GroupBadge group={group} />
          </div>
          {!isLive && isScheduled ? (
            <MatchKickoffTime
              kickoffUtc={match.match_date}
              hostCity={match.host_city}
              variant="dateTime"
              className="text-[10px] sm:text-xs text-white/35 leading-tight"
            />
          ) : (
            <span className="text-[10px] sm:text-xs text-white/35 truncate">{match.stadium || match.venue}</span>
          )}
        </div>

        {/* Mobile: centered compact row */}
        <div className="sm:hidden flex items-center justify-center gap-2.5 w-full">
          <div className="flex items-center gap-1.5 shrink-0">
            <TeamFlag {...home} size={28} className="shrink-0" />
            <span className="text-xs font-semibold">{home.code}</span>
          </div>

          <div className="font-display font-bold tabular-nums shrink-0 leading-none">
            {isScheduled && !overlay ? (
              <span className="text-white/25 text-xs">vs</span>
            ) : scoreLine ? (
              <span className="text-base">{scoreLine}</span>
            ) : isCompleted ? (
              <span className="text-white/35 text-xs">FT</span>
            ) : isLive ? (
              <span className="text-white/35 text-xs">—</span>
            ) : (
              <span className="text-white/25 text-xs">vs</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-semibold">{away.code}</span>
            <TeamFlag {...away} size={28} className="shrink-0" />
          </div>
        </div>

        {/* Desktop: full names */}
        <div className="hidden sm:flex items-center gap-3 min-w-0 w-full">
          <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
            <span className="text-sm font-medium truncate text-right group-hover:text-accent transition-colors">
              {home.name}
            </span>
            <TeamFlag {...home} size={32} className="shrink-0" />
          </div>

          <div className="font-display text-xl font-bold tabular-nums shrink-0 px-1 leading-none">
            {isScheduled && !overlay ? (
              <span className="text-white/25 text-sm">vs</span>
            ) : scoreLine ? (
              <span>{scoreLine}</span>
            ) : isCompleted ? (
              <span className="text-white/35 text-sm">FT</span>
            ) : isLive ? (
              <span className="text-white/35 text-sm">—</span>
            ) : (
              <span className="text-white/25 text-sm">vs</span>
            )}
          </div>

          <div className="flex-1 flex items-center gap-2 min-w-0">
            <TeamFlag {...away} size={32} className="shrink-0" />
            <span className="text-sm font-medium truncate group-hover:text-accent transition-colors">
              {away.name}
            </span>
          </div>
        </div>

        {(status === "completed" || isLive) && goalLine && (
          <p className="mt-3 text-xs text-white/35 truncate border-t border-white/[0.06] pt-3">{goalLine}</p>
        )}

        {(match.stadium || match.venue) && isScheduled && !overlay && (
          <p className="mt-3 text-xs text-white/30 border-t border-white/[0.06] pt-3 truncate sm:hidden">
            {match.stadium || match.venue}
          </p>
        )}
      </article>
    </Link>
  );
}
