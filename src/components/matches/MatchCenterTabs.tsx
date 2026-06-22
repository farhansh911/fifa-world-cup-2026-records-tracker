"use client";

import { useMemo, useState } from "react";
import { MatchScheduleList } from "@/components/matches/MatchScheduleList";
import { MatchResultsList } from "@/components/matches/MatchResultsList";
import { LiveMatchBoard } from "@/components/matches/LiveMatchBoard";
import { cn } from "@/lib/utils";
import type { Match } from "@/types/database";
import type { ScheduleMatch } from "@/lib/matches";
import type { LiveMatchView } from "@/lib/live-matches";

type Tab = "schedule" | "live" | "results";

interface MatchCenterTabsProps {
  schedule: ScheduleMatch[];
  live: Match[];
  completed: Match[];
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

  const filteredSchedule = useMemo(
    () => (groupFilter === "all" ? schedule : schedule.filter((m) => m.group_name === groupFilter)),
    [schedule, groupFilter]
  );

  const filteredCompleted = useMemo(
    () =>
      groupFilter === "all"
        ? completed
        : completed.filter((m) => (m.group_name ?? m.home_team?.group_name) === groupFilter),
    [completed, groupFilter]
  );

  return (
    <div>
      <div className="flex gap-1 border-b border-white/[0.08] mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
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

      {(active === "schedule" || active === "results") && groups.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setGroupFilter("all")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors",
              groupFilter === "all"
                ? "bg-accent/20 text-accent border-accent/40"
                : "border-white/10 text-white/45 hover:text-white/70"
            )}
          >
            All groups
          </button>
          {groups.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupFilter(g)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors",
                groupFilter === g
                  ? "bg-accent/20 text-accent border-accent/40"
                  : "border-white/10 text-white/45 hover:text-white/70"
              )}
            >
              Group {g}
            </button>
          ))}
        </div>
      )}

      {active === "schedule" && (
        <div>
          <p className="text-sm text-white/40 mb-6">
            Full tournament fixture list — tap any match for details.
          </p>
          <MatchScheduleList matches={filteredSchedule} />
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
        <div>
          <p className="text-sm text-white/40 mb-6">
            Final scores grouped by date — tap any match for stats and group standings.
          </p>
          <MatchResultsList matches={filteredCompleted} />
        </div>
      )}
    </div>
  );
}
