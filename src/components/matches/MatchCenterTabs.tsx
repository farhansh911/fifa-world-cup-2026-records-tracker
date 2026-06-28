"use client";

import { useMemo, useState } from "react";
import { MatchScheduleList } from "@/components/matches/MatchScheduleList";
import { MatchResultsList } from "@/components/matches/MatchResultsList";
import { MatchCenterGroupStandings } from "@/components/matches/MatchCenterGroupStandings";
import { LiveMatchBoard } from "@/components/matches/LiveMatchBoard";
import { cn } from "@/lib/utils";
import type { Match } from "@/types/database";
import type { ScheduleMatch } from "@/lib/matches";
import type { LiveMatchView } from "@/lib/live-matches";
import type { GroupStandings } from "@/lib/group-standings";

type Tab = "schedule" | "live" | "results";

interface MatchCenterTabsProps {
  schedule: ScheduleMatch[];
  live: Match[];
  completed: Match[];
  groupStandings: GroupStandings[];
  liveViews?: LiveMatchView[];
  featuredView?: LiveMatchView | null;
  defaultTab?: Tab;
}

const tabs: { id: Tab; label: string }[] = [
  { id: "schedule", label: "Schedule" },
  { id: "live", label: "Live" },
  { id: "results", label: "Results" },
];

export function MatchCenterTabs({
  schedule,
  live,
  completed,
  groupStandings,
  liveViews = [],
  featuredView = null,
  defaultTab = "schedule",
}: MatchCenterTabsProps) {
  const [active, setActive] = useState<Tab>(defaultTab);
  const [groupFilter, setGroupFilter] = useState<string>("all");

  const groups = useMemo(() => {
    const set = new Set<string>();
    for (const m of schedule) {
      if (m.group_name) set.add(m.group_name);
    }
    return [...set].sort();
  }, [schedule]);

  const hasKnockout = useMemo(() => schedule.some((m) => m.stage_label), [schedule]);

  const filteredSchedule = useMemo(() => {
    if (groupFilter === "all") return schedule;
    if (groupFilter === "knockout") return schedule.filter((m) => m.stage_label);
    return schedule.filter((m) => m.group_name === groupFilter);
  }, [schedule, groupFilter]);

  const filteredCompleted = useMemo(() => {
    if (groupFilter === "all") return completed;
    if (groupFilter === "knockout") {
      return completed.filter((m) => {
        const summary = m.summary?.toLowerCase().trim();
        return summary && summary !== "group stage";
      });
    }
    return completed.filter((m) => (m.group_name ?? m.home_team?.group_name) === groupFilter);
  }, [completed, groupFilter]);

  const selectedGroupStandings = useMemo(
    () => (groupFilter === "all" ? null : groupStandings.find((g) => g.group === groupFilter) ?? null),
    [groupFilter, groupStandings]
  );

  return (
    <div className="min-w-0 overflow-x-hidden">
      <div className="flex gap-0 sm:gap-1 border-b border-white/[0.08] mb-5 sm:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "flex-1 sm:flex-none px-3 sm:px-4 py-3 text-sm font-medium transition-colors relative text-center",
              active === tab.id ? "text-white" : "text-white/40 hover:text-white/70"
            )}
          >
            {tab.label}
            {tab.id === "live" && (liveViews.length > 0 || live.length > 0) && (
              <span className="ml-1.5 inline-flex w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            )}
            {active === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </div>

      {(active === "schedule" || active === "results") && (groups.length > 0 || hasKnockout) && (
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 mb-5 sm:mb-6 overflow-x-auto">
          <div className="flex gap-2 w-max sm:w-auto sm:flex-wrap pb-1">
            <button
              type="button"
              onClick={() => setGroupFilter("all")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap shrink-0",
                groupFilter === "all"
                  ? "bg-accent/20 text-accent border-accent/40"
                  : "border-white/10 text-white/45 hover:text-white/70"
              )}
            >
              All matches
            </button>
            {hasKnockout && (
              <button
                type="button"
                onClick={() => setGroupFilter("knockout")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap shrink-0",
                  groupFilter === "knockout"
                    ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                    : "border-white/10 text-white/45 hover:text-white/70"
                )}
              >
                Knockout
              </button>
            )}
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupFilter(g)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors whitespace-nowrap shrink-0",
                  groupFilter === g
                    ? "bg-accent/20 text-accent border-accent/40"
                    : "border-white/10 text-white/45 hover:text-white/70"
                )}
              >
                Group {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {active === "schedule" && (
        <div className="min-w-0">
          <p className="text-sm text-white/40 mb-5 sm:mb-6">
            Next matches shown at the top — full fixture list below, starting from today.
          </p>
          <MatchScheduleList matches={filteredSchedule} />
          {selectedGroupStandings && (
            <MatchCenterGroupStandings standings={selectedGroupStandings} />
          )}
        </div>
      )}

      {active === "live" && (
        <div>
          <LiveMatchBoard
            initialLive={liveViews}
            initialFeatured={featuredView}
          />
        </div>
      )}

      {active === "results" && (
        <div className="min-w-0">
          <p className="text-sm text-white/40 mb-5 sm:mb-6">
            Final scores grouped by date — tap any match for stats and group standings.
          </p>
          <MatchResultsList matches={filteredCompleted} />
          {selectedGroupStandings && (
            <MatchCenterGroupStandings standings={selectedGroupStandings} />
          )}
        </div>
      )}
    </div>
  );
}
