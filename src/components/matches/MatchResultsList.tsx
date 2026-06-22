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
    <div className="space-y-8">
      {Object.entries(grouped).map(([date, dayMatches]) => (
        <div key={date}>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-3 sticky top-0 bg-[#0c0818] py-2 z-10">
            {date}
          </h3>
          <div className="divide-y divide-white/[0.06] border border-white/[0.08]">
            {dayMatches.map((match) => {
              const full = matches.find((m) => m.id === match.id);
              const goalLine = full?.goalscorers;

              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="block px-4 sm:px-6 py-4 sm:py-5 hover:bg-white/[0.03] transition-colors group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <TeamFlag {...match.home} size={40} />
                      <span className="text-base font-medium truncate group-hover:text-accent transition-colors">
                        {match.home.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-3 shrink-0">
                      <span className="font-display text-2xl font-bold tabular-nums">
                        {formatScoreLine("completed", match.home_score, match.away_score) ?? "—"}
                      </span>
                      {match.group_name && <GroupBadge group={match.group_name} />}
                    </div>

                    <div className="flex items-center gap-3 flex-1 min-w-0 sm:justify-end">
                      <span className="text-base font-medium truncate text-right group-hover:text-accent transition-colors">
                        {match.away.name}
                      </span>
                      <TeamFlag {...match.away} size={40} />
                    </div>
                  </div>

                  {(goalLine || match.stadium) && (
                    <p className={cn("mt-3 text-xs text-white/35", goalLine && "truncate")}>
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
