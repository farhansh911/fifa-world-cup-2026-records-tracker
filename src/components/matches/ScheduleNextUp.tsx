"use client";

import Link from "next/link";
import { formatScoreLine } from "@/lib/team-aliases";
import { TeamFlag } from "@/components/matches/TeamFlag";
import { MatchKickoffTime } from "@/components/matches/MatchKickoffTime";
import { GroupBadge } from "@/components/matches/GroupBadge";
import { cn } from "@/lib/utils";
import type { ScheduleMatch } from "@/lib/matches";

interface ScheduleNextUpProps {
  matches: ScheduleMatch[];
  onJumpToFull?: () => void;
}

export function ScheduleNextUp({ matches, onJumpToFull }: ScheduleNextUpProps) {
  if (matches.length === 0) return null;

  return (
    <section className="mb-8 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">Next up</h2>
          <p className="text-xs text-white/40 mt-0.5 hidden sm:block">
            Live and upcoming fixtures — no scrolling needed
          </p>
        </div>
        {onJumpToFull && (
          <button
            type="button"
            onClick={onJumpToFull}
            className="text-xs text-white/45 hover:text-accent transition-colors shrink-0 self-start sm:self-auto"
          >
            Full schedule ↓
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {matches.map((match) => {
          const isLive = match.status === "live";
          const scoreLine = formatScoreLine(match.status, match.home_score, match.away_score);

          return (
            <Link
              key={match.id}
              href={`/matches/${match.id}`}
              className={cn(
                "block border p-3.5 sm:p-4 transition-colors hover:bg-white/[0.03] group min-w-0",
                isLive
                  ? "border-red-500/30 bg-red-500/[0.04]"
                  : "border-accent/25 bg-accent/[0.04] hover:border-accent/40"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  {isLive ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      Live {match.minute}&apos;
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent shrink-0">Upcoming</span>
                  )}
                  <GroupBadge group={match.group_name} />
                </div>
                <MatchKickoffTime
                  kickoffUtc={match.match_date}
                  hostCity={match.host_city}
                  variant="dateTime"
                  className="text-[10px] text-white/40 text-right leading-tight"
                />
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <TeamFlag {...match.home} size={28} className="shrink-0" />
                  <span className="text-sm font-medium truncate group-hover:text-accent transition-colors hidden sm:inline">
                    {match.home.name}
                  </span>
                  <span className="text-xs font-semibold truncate sm:hidden">{match.home.code}</span>
                </div>

                <span className="font-display text-base sm:text-lg font-bold tabular-nums shrink-0 px-0.5 leading-none">
                  {scoreLine ?? (isLive ? "—" : "vs")}
                </span>

                <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                  <span className="text-sm font-medium truncate text-right group-hover:text-accent transition-colors hidden sm:inline">
                    {match.away.name}
                  </span>
                  <span className="text-xs font-semibold truncate sm:hidden">{match.away.code}</span>
                  <TeamFlag {...match.away} size={28} className="shrink-0" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
