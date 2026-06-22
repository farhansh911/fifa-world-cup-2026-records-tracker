import Link from "next/link";
import { TeamFlag } from "@/components/matches/TeamFlag";
import {
  qualificationBadgeClass,
  type GroupStandings,
  type GroupStandingRow,
} from "@/lib/group-standings";
import { cn } from "@/lib/utils";

interface GroupStandingsTableProps {
  standings: GroupStandings;
  highlightTeams?: string[];
  compact?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
}

function shortStatusLabel(label: string, compact?: boolean): string {
  if (!compact) return label;
  const map: Record<string, string> = {
    "Round of 32": "R32",
    "Round of 32 (3rd)": "R32",
    "Best 3rd place": "3rd+",
    Eliminated: "Out",
    "Can reach top 2": "Alive",
    "Still in hunt": "Alive",
    "Top 2": "Top 2",
    "In progress": "—",
    "Not started": "—",
  };
  return map[label] ?? label;
}

function Row({
  row,
  highlight,
  compact,
}: {
  row: GroupStandingRow;
  highlight: boolean;
  compact?: boolean;
}) {
  return (
    <tr
      className={cn(
        "border-t border-white/[0.06] transition-colors",
        highlight && "bg-accent/8"
      )}
    >
      <td className={cn("py-2 pl-2 font-display font-bold tabular-nums text-white/50", compact ? "w-7 pl-2.5" : "w-10 pl-3")}>
        {row.position}
      </td>
      <td className={cn("py-2", compact ? "pr-1 min-w-0" : "pr-2")}>
        <div className="flex items-center gap-1.5 min-w-0">
          <TeamFlag name={row.name} code={row.code} flag_url={row.flag_url} size={compact ? 18 : 24} />
          <span className={cn("font-medium truncate", compact ? "text-xs" : "text-sm", highlight && "text-accent")}>
            {row.name}
          </span>
        </div>
      </td>
      <td className="py-2 px-1 text-center tabular-nums text-white/70 text-xs">{row.played}</td>
      {!compact && (
        <>
          <td className="py-2 px-1 text-center tabular-nums text-white/70 text-sm hidden sm:table-cell">{row.won}</td>
          <td className="py-2 px-1 text-center tabular-nums text-white/70 text-sm hidden sm:table-cell">{row.drawn}</td>
          <td className="py-2 px-1 text-center tabular-nums text-white/70 text-sm hidden sm:table-cell">{row.lost}</td>
        </>
      )}
      <td className="py-2 px-1 text-center tabular-nums text-white/70 text-xs">{row.goalsFor}:{row.goalsAgainst}</td>
      <td className="py-2 px-1 text-center tabular-nums font-semibold text-xs">{row.points}</td>
      <td className={cn("py-2 text-right", compact ? "pr-2" : "pr-3")}>
        <span
          className={cn(
            "inline-flex items-center rounded border font-bold uppercase tracking-wide",
            compact ? "px-1 py-0.5 text-[8px]" : "px-1.5 py-0.5 text-[9px]",
            qualificationBadgeClass(row.qualification)
          )}
          title={row.qualificationLabel}
        >
          {shortStatusLabel(row.qualificationLabel, compact)}
        </span>
      </td>
    </tr>
  );
}

export function GroupStandingsTable({
  standings,
  highlightTeams = [],
  compact = false,
  showHeader = true,
  showFooter = true,
}: GroupStandingsTableProps) {
  const highlights = new Set(highlightTeams.map((t) => t.toLowerCase()));

  return (
    <div className="border border-white/[0.08] overflow-hidden h-full">
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold">Group {standings.group}</h3>
          <span className="text-[10px] uppercase tracking-wider text-white/35">
            {standings.matchesPlayed}/{standings.matchesTotal} played
            {standings.isComplete ? " · Final" : ""}
          </span>
        </div>
      )}

      <table className="w-full table-fixed">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-white/35">
            <th className={cn("py-2 text-left font-semibold", compact ? "pl-2.5 w-7" : "pl-3 w-10")}>#</th>
            <th className="py-2 text-left font-semibold">Team</th>
            <th className="py-2 px-1 text-center font-semibold w-8">P</th>
            {!compact && (
              <>
                <th className="py-2 px-1 text-center font-semibold w-8 hidden sm:table-cell">W</th>
                <th className="py-2 px-1 text-center font-semibold w-8 hidden sm:table-cell">D</th>
                <th className="py-2 px-1 text-center font-semibold w-8 hidden sm:table-cell">L</th>
              </>
            )}
            <th className="py-2 px-1 text-center font-semibold w-12">GD</th>
            <th className="py-2 px-1 text-center font-semibold w-9">Pts</th>
            <th className={cn("py-2 text-right font-semibold", compact ? "pr-2 w-11" : "pr-3 w-16")}>
              {compact ? "Q" : "Status"}
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.rows.map((row) => (
            <Row
              key={row.teamId}
              row={row}
              highlight={highlights.has(row.name.toLowerCase())}
              compact={compact}
            />
          ))}
        </tbody>
      </table>

      {showFooter && (
        <p className="px-3 py-2 text-[10px] text-white/30 border-t border-white/[0.06]">
          Top 2 qualify · Best 8 third-placed teams also advance to Round of 32
        </p>
      )}
    </div>
  );
}

export function GroupStandingsGrid({ groups }: { groups: GroupStandings[] }) {
  if (groups.length === 0) {
    return (
      <p className="card p-10 text-center text-white/35 text-sm">
        Group standings will appear once group-stage matches are played.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {groups.map((g) => (
          <GroupStandingsTable key={g.group} standings={g} compact showFooter={false} />
        ))}
      </div>
      <p className="mt-5 text-xs text-white/30 text-center">
        Top 2 per group qualify · Best 8 third-placed teams also advance · Hover status badges for details
      </p>
    </div>
  );
}

export function GroupStandingsLink({ group }: { group: string }) {
  return (
    <Link
      href={`/bracket?tab=groups&group=${group}`}
      className="text-xs text-accent hover:underline"
    >
      View all groups →
    </Link>
  );
}
