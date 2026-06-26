"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatScoreLine } from "@/lib/team-aliases";
import { TeamFlag } from "@/components/matches/TeamFlag";
import { GroupBadge } from "@/components/matches/GroupBadge";
import { cn } from "@/lib/utils";
import { groupMatchesByDate, type ScheduleMatch } from "@/lib/matches";
import type { Match } from "@/types/database";

interface MatchResultsListProps {
  matches: Match[];
}

function toScheduleFromMatch(match: Match): ScheduleMatch {
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
    stadium: match.stadium,
    venue: match.venue,
  };
}

export function MatchResultsList({ matches }: MatchResultsListProps) {
  const [viewerLocal, setViewerLocal] = useState(false);

  useEffect(() => setViewerLocal(true), []);

  const scheduleMatches = useMemo(() => matches.map(toScheduleFromMatch), [matches]);
  const grouped = useMemo(
    () => groupMatchesByDate(scheduleMatches, viewerLocal),
    [scheduleMatches, viewerLocal]
  );

  if (matches.length === 0) {
    return (
      <p className="card p-10 text-center text-white/35 text-sm">No results in this group yet.</p>
    );
  }

  return (
    <div className="space-y-8 min-w-0">
      {Object.entries(grouped).map(([date, dayMatches]) => (
        <div key={date} className="min-w-0">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/35 mb-3 sticky top-14 bg-[var(--theme-bg)] py-2 z-10 border-b border-white/[0.04] truncate">
            {date}
          </h3>
          <div className="divide-y divide-white/[0.06] border border-white/[0.08]">
            {dayMatches.map((match) => {
              const full = matches.find((m) => m.id === match.id);
              const goalLine = full?.goalscorers;
              const scoreLine = formatScoreLine("completed", match.home_score, match.away_score);

              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="block px-3 sm:px-6 py-3.5 sm:py-5 hover:bg-white/[0.03] transition-colors group min-w-0"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                      <span className="text-sm font-medium truncate text-right group-hover:text-accent transition-colors hidden sm:inline">
                        {match.home.name}
                      </span>
                      <span className="text-xs font-semibold shrink-0 sm:hidden">{match.home.code}</span>
                      <TeamFlag {...match.home} size={28} className="shrink-0 sm:hidden" />
                      <TeamFlag {...match.home} size={36} className="shrink-0 hidden sm:block" />
                    </div>

                    <div className="shrink-0 flex flex-col items-center px-1 sm:px-2">
                      <span className="font-display text-base sm:text-2xl font-bold tabular-nums leading-none">
                        {scoreLine ?? "—"}
                      </span>
                      {match.group_name && (
                        <div className="mt-1.5 sm:hidden">
                          <GroupBadge group={match.group_name} />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <TeamFlag {...match.away} size={28} className="shrink-0 sm:hidden" />
                      <TeamFlag {...match.away} size={36} className="shrink-0 hidden sm:block" />
                      <span className="text-sm font-medium truncate group-hover:text-accent transition-colors hidden sm:inline">
                        {match.away.name}
                      </span>
                      <span className="text-xs font-semibold shrink-0 sm:hidden">{match.away.code}</span>
                    </div>

                    {match.group_name && (
                      <div className="hidden sm:block shrink-0">
                        <GroupBadge group={match.group_name} />
                      </div>
                    )}
                  </div>

                  {(goalLine || match.stadium) && (
                    <p className={cn("mt-2.5 sm:mt-3 text-xs text-white/35", goalLine && "truncate")}>
                      {goalLine ?? match.stadium}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
