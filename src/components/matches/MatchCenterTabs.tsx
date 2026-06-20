"use client";

import { useState } from "react";
import { MatchCard } from "@/components/matches/MatchCard";
import { MatchScheduleList } from "@/components/matches/MatchScheduleList";
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

  return (
    <div>
      <div className="flex gap-1 border-b border-white/[0.08] mb-8">
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

      {active === "schedule" && (
        <div>
          <p className="text-sm text-white/40 mb-6">
            Full tournament fixture list — tap any match for details.
          </p>
          <MatchScheduleList matches={schedule} />
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
          {completed.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completed.map((m) => <MatchCard key={m.id} match={m} variant="completed" />)}
            </div>
          ) : (
            <p className="card p-10 text-center text-white/35 text-sm">No results yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
