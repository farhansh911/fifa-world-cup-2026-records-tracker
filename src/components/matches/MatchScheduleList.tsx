"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatScoreLine } from "@/lib/team-aliases";
import { TeamFlag } from "@/components/matches/TeamFlag";
import { MatchKickoffTime } from "@/components/matches/MatchKickoffTime";
import { GroupBadge } from "@/components/matches/GroupBadge";
import { ScheduleNextUp } from "@/components/matches/ScheduleNextUp";
import { cn } from "@/lib/utils";
import {
  dateHeaderId,
  getNextUpMatches,
  getScheduleScrollTarget,
  groupMatchesByDate,
  type ScheduleMatch,
} from "@/lib/matches";

interface MatchScheduleListProps {
  matches: ScheduleMatch[];
  showVenue?: boolean;
  compact?: boolean;
  showNextUp?: boolean;
}

export function MatchScheduleList({
  matches,
  showVenue = true,
  compact = false,
  showNextUp = true,
}: MatchScheduleListProps) {
  const [viewerLocal, setViewerLocal] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const hasScrolled = useRef(false);
  const fullScheduleRef = useRef<HTMLDivElement>(null);

  useEffect(() => setViewerLocal(true), []);

  const grouped = useMemo(
    () => groupMatchesByDate(matches, viewerLocal),
    [matches, viewerLocal]
  );

  const nextUp = useMemo(() => getNextUpMatches(matches), [matches]);
  const scrollTargetId = useMemo(
    () => getScheduleScrollTarget(matches, grouped, viewerLocal),
    [matches, grouped, viewerLocal]
  );

  const pastDateKeys = useMemo(() => {
    if (showPast) return new Set<string>();
    const now = Date.now();
    const past = new Set<string>();
    for (const [dateKey, dayMatches] of Object.entries(grouped)) {
      const allCompleted = dayMatches.every((m) => m.status === "completed");
      const allInPast = dayMatches.every(
        (m) => m.status === "completed" || new Date(m.match_date).getTime() < now - 3 * 60 * 60 * 1000
      );
      if (allCompleted && allInPast) past.add(dateKey);
    }
    return past;
  }, [grouped, showPast]);

  const hiddenPastCount = pastDateKeys.size;

  const scrollToTarget = useCallback(() => {
    if (!scrollTargetId) return;
    const el = document.getElementById(scrollTargetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [scrollTargetId]);

  useEffect(() => {
    if (!viewerLocal || hasScrolled.current || !scrollTargetId) return;
    hasScrolled.current = true;
    requestAnimationFrame(() => {
      const el = document.getElementById(scrollTargetId);
      el?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }, [viewerLocal, scrollTargetId]);

  const jumpToFullSchedule = useCallback(() => {
    fullScheduleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    scrollToTarget();
  }, [scrollToTarget]);

  if (matches.length === 0) {
    return (
      <p className="text-sm text-white/40 py-8 text-center">No matches in the schedule yet.</p>
    );
  }

  return (
    <div className="min-w-0">
      {showNextUp && nextUp.length > 0 && (
        <ScheduleNextUp matches={nextUp} onJumpToFull={jumpToFullSchedule} />
      )}

      {hiddenPastCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="px-3 py-1.5 text-xs font-semibold rounded-full border border-white/10 text-white/45 hover:text-white/70 hover:border-white/20 transition-colors"
          >
            {showPast ? "Hide earlier matches" : `Show ${hiddenPastCount} earlier match day${hiddenPastCount === 1 ? "" : "s"}`}
          </button>
          <button
            type="button"
            onClick={scrollToTarget}
            className="px-3 py-1.5 text-xs font-semibold rounded-full border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
          >
            Jump to next match
          </button>
        </div>
      )}

      <div ref={fullScheduleRef} className="space-y-8">
        {Object.entries(grouped).map(([date, dayMatches]) => {
          if (pastDateKeys.has(date)) return null;
          const headerId = dateHeaderId(date);

          return (
            <div key={date} id={headerId} className="scroll-mt-24">
              <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/35 mb-3 sticky top-14 bg-[var(--theme-bg)] py-2 z-10 border-b border-white/[0.04] truncate">
                {date}
              </h3>
              <div className="divide-y divide-white/[0.06] border border-white/[0.08]">
                {dayMatches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className={cn(
                      "block hover:bg-white/[0.03] transition-colors group min-w-0",
                      compact ? "px-3 py-3" : "px-3 sm:px-4 py-3 sm:py-4",
                      match.status === "live" && "bg-red-500/[0.03]",
                      nextUp.some((n) => n.id === match.id) && match.status !== "live" && "bg-accent/[0.03]"
                    )}
                  >
                    {/* Mobile: time/meta row, then match row */}
                    <div className="flex items-center justify-between gap-2 mb-2.5 sm:hidden min-w-0">
                      <MatchKickoffTime
                        kickoffUtc={match.match_date}
                        hostCity={match.host_city}
                        variant="time"
                        className="text-[11px] text-white/45 leading-tight"
                        secondaryClassName="text-[8px] leading-tight"
                      />
                      <div className="flex items-center gap-1.5 shrink-0">
                        {match.group_name && <GroupBadge group={match.group_name} />}
                        {match.status === "live" && (
                          <span className="text-[10px] text-red-400 font-semibold">LIVE {match.minute}&apos;</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                      <div className={cn("shrink-0 text-right hidden sm:block", compact ? "w-[4.25rem]" : "w-24")}>
                        <MatchKickoffTime
                          kickoffUtc={match.match_date}
                          hostCity={match.host_city}
                          variant="time"
                          className="text-[11px] sm:text-xs text-white/45 leading-tight"
                          secondaryClassName="text-[8px] sm:text-[9px] leading-tight"
                        />
                        {match.group_name && (
                          <div className="mt-1 flex justify-end">
                            <GroupBadge group={match.group_name} />
                          </div>
                        )}
                        {match.status === "live" && (
                          <p className="text-[10px] text-red-400 font-semibold mt-0.5">LIVE {match.minute}&apos;</p>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2.5">
                        <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                          <span className="text-sm font-medium truncate text-right group-hover:text-accent transition-colors hidden sm:inline">
                            {match.home.name}
                          </span>
                          <span className="text-xs font-semibold shrink-0 sm:hidden">{match.home.code}</span>
                          <TeamFlag {...match.home} size={compact ? 22 : 28} className="shrink-0" />
                        </div>

                        <div className="shrink-0 flex items-center justify-center px-0.5">
                          {match.status === "scheduled" || match.status === "postponed" ? (
                            <span className="text-[11px] text-white/30 font-medium leading-none">vs</span>
                          ) : formatScoreLine(match.status, match.home_score, match.away_score) ? (
                            <span className="font-display font-bold tabular-nums text-sm sm:text-base leading-none">
                              {formatScoreLine(match.status, match.home_score, match.away_score)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-white/30 font-medium leading-none">FT</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <TeamFlag {...match.away} size={compact ? 22 : 28} className="shrink-0" />
                          <span className="text-sm font-medium truncate group-hover:text-accent transition-colors hidden sm:inline">
                            {match.away.name}
                          </span>
                          <span className="text-xs font-semibold shrink-0 sm:hidden">{match.away.code}</span>
                        </div>
                      </div>

                      {showVenue && (match.stadium || match.venue) && !compact && (
                        <p className="hidden lg:block text-xs text-white/30 w-36 truncate shrink-0 text-right">
                          {match.stadium || match.venue}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
