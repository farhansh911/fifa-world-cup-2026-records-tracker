"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { GroupStandings } from "@/lib/group-standings";
import type { BracketRound } from "@/lib/bracket";
import { GroupStandingsGrid } from "@/components/groups/GroupStandingsTable";
import { BracketQualifiersSummary, TournamentBracket } from "@/components/bracket/TournamentBracket";

type Tab = "groups" | "bracket";

interface BracketTabsProps {
  groups: GroupStandings[];
  rounds: BracketRound[];
  qualifiedTeams: string[];
  initialTab?: Tab;
  initialGroup?: string;
}

export function BracketTabs({
  groups,
  rounds,
  qualifiedTeams,
  initialTab = "groups",
  initialGroup,
}: BracketTabsProps) {
  const [active, setActive] = useState<Tab>(initialTab);
  const [groupFilter, setGroupFilter] = useState(initialGroup ?? "all");

  const filteredGroups = useMemo(
    () => (groupFilter === "all" ? groups : groups.filter((g) => g.group === groupFilter)),
    [groups, groupFilter]
  );

  return (
    <div>
      <div className="flex gap-1 border-b border-white/[0.08] mb-6">
        {(
          [
            { id: "groups" as const, label: "Group standings" },
            { id: "bracket" as const, label: "Knockout bracket" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              active === tab.id ? "text-white" : "text-white/40 hover:text-white/70"
            )}
          >
            {tab.label}
            {active === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </div>

      {active === "groups" && (
        <div>
          <p className="text-sm text-white/40 mb-6">
            Live group tables with qualification status — top 2 plus the best 8 third-placed teams advance.
          </p>

          {groups.length > 0 && (
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
                  key={g.group}
                  type="button"
                  onClick={() => setGroupFilter(g.group)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors",
                    groupFilter === g.group
                      ? "bg-accent/20 text-accent border-accent/40"
                      : "border-white/10 text-white/45 hover:text-white/70"
                  )}
                >
                  Group {g.group}
                </button>
              ))}
            </div>
          )}

          <GroupStandingsGrid groups={filteredGroups} />
        </div>
      )}

      {active === "bracket" && (
        <div>
          <p className="text-sm text-white/40 mb-6">
            Full knockout path from Round of 32 to the final. Placeholder slots update as groups finish.
          </p>
          <BracketQualifiersSummary teams={qualifiedTeams} />
          <TournamentBracket rounds={rounds} />
        </div>
      )}
    </div>
  );
}
