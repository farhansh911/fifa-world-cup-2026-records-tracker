"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { GroupStandings } from "@/lib/group-standings";
import { buildBestThirdPlaceTable } from "@/lib/group-standings";
import { bracketMatchesByNumber, type BracketViewMatch } from "@/lib/bracket";
import { GroupStandingsGrid } from "@/components/groups/GroupStandingsTable";
import { BestThirdPlaceTable } from "@/components/groups/BestThirdPlaceTable";
import { WorldCupBracket } from "@/components/bracket/WorldCupBracket";

type Tab = "groups" | "bracket";

interface BracketTabsProps {
  groups?: GroupStandings[];
  bracketMatches?: BracketViewMatch[];
  initialTab?: Tab;
  initialGroup?: string;
}

export function BracketTabs({
  groups = [],
  bracketMatches = [],
  initialTab = "groups",
  initialGroup,
}: BracketTabsProps) {
  const [active, setActive] = useState<Tab>(initialTab);
  const [groupFilter, setGroupFilter] = useState(initialGroup ?? "all");

  const bracket = useMemo(
    () => bracketMatchesByNumber(bracketMatches),
    [bracketMatches]
  );

  const filteredGroups = useMemo(
    () => (groupFilter === "all" ? groups : groups.filter((g) => g.group === groupFilter)),
    [groups, groupFilter]
  );

  const bestThirdRows = useMemo(() => buildBestThirdPlaceTable(groups), [groups]);
  const thirdPlaceRaceLive = useMemo(
    () => groups.some((g) => !g.isComplete),
    [groups]
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
            Live group tables — top 2 plus the best 8 third-placed teams advance. Third-place spots stay
            provisional until every group has finished.
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

          {groupFilter === "all" && (
            <BestThirdPlaceTable rows={bestThirdRows} groupsLive={thirdPlaceRaceLive} />
          )}

          <GroupStandingsGrid groups={filteredGroups} />
        </div>
      )}

      {active === "bracket" && (
        <WorldCupBracket groups={groups} bracket={bracket} />
      )}
    </div>
  );
}
