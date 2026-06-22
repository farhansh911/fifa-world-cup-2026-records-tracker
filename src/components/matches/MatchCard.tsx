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
    <Link href={`/matches/${match.id}`} className="block group">
      <article className={cn("card card-hover p-4", isLive && "border-red-500/30")}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
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
              className="text-xs text-white/35"
            />
          ) : (
            <span className="text-xs text-white/35">{match.stadium || match.venue}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <TeamFlag {...home} size={36} />
            <span className="text-sm font-medium truncate group-hover:text-accent transition-colors">
              {home.name}
            </span>
          </div>

          <div className="font-display text-xl font-bold tabular-nums shrink-0 px-2">
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

          <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
            <span className="text-sm font-medium truncate text-right group-hover:text-accent transition-colors">
              {away.name}
            </span>
            <TeamFlag {...away} size={36} />
          </div>
        </div>

        {(status === "completed" || isLive) && goalLine && (
          <p className="mt-3 text-xs text-white/35 truncate border-t border-white/[0.06] pt-3">{goalLine}</p>
        )}

        {(match.stadium || match.venue) && isScheduled && !overlay && (
          <p className="mt-3 text-xs text-white/30 border-t border-white/[0.06] pt-3">{match.stadium || match.venue}</p>
        )}
      </article>
    </Link>
  );
}
