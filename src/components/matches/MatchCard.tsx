import Link from "next/link";
import { formatScoreLine } from "@/lib/team-aliases";
import { cn, getStatusColor } from "@/lib/utils";
import { MatchKickoffTime } from "@/components/matches/MatchKickoffTime";
import { Badge } from "@/components/ui/Badge";
import { TeamFlag } from "@/components/matches/TeamFlag";
import type { Match } from "@/types/database";

interface MatchCardProps {
  match: Match;
  variant?: "live" | "upcoming" | "completed";
}

export function MatchCard({ match, variant }: MatchCardProps) {
  const status = variant || match.status;
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
      <article className={cn("card card-hover p-4", status === "live" && "border-red-500/30")}>
        <div className="flex items-center justify-between mb-4">
          <Badge variant={status === "live" ? "live" : "default"} className={getStatusColor(match.status)}>
            {status === "live" && match.minute ? `${match.minute}'` : match.status}
          </Badge>
          {status === "upcoming" || match.status === "scheduled" ? (
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
            {match.status === "scheduled" ? (
              <span className="text-white/25 text-sm">vs</span>
            ) : formatScoreLine(match.status, match.home_score, match.away_score) ? (
              <span>{formatScoreLine(match.status, match.home_score, match.away_score)}</span>
            ) : (
              <span className="text-white/35 text-sm">FT</span>
            )}
          </div>

          <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
            <span className="text-sm font-medium truncate text-right group-hover:text-accent transition-colors">
              {away.name}
            </span>
            <TeamFlag {...away} size={36} />
          </div>
        </div>

        {status === "completed" && match.goalscorers && (
          <p className="mt-3 text-xs text-white/35 truncate border-t border-white/[0.06] pt-3">{match.goalscorers}</p>
        )}

        {(match.stadium || match.venue) && (status === "upcoming" || match.status === "scheduled") && (
          <p className="mt-3 text-xs text-white/30 border-t border-white/[0.06] pt-3">{match.stadium || match.venue}</p>
        )}
      </article>
    </Link>
  );
}
