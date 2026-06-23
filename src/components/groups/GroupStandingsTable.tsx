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

function shortStatusLabel(label: string): string {
  const map: Record<string, string> = {
    "Round of 32": "R32",
    "Round of 32 (3rd)": "R32",
    "Best 3rd place": "3rd+",
    Eliminated: "Out",
    "Can reach top 2": "Alive",
    "Still in hunt": "Alive",
    "Top 2": "Top 2",
    "In progress": "Live",
    "Not started": "—",
  };
  return map[label] ?? label;
}

function StatusBadge({ row, size = "md" }: { row: GroupStandingRow; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border font-bold uppercase tracking-wide whitespace-nowrap",
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
        qualificationBadgeClass(row.qualification)
      )}
      title={row.qualificationLabel}
    >
      {shortStatusLabel(row.qualificationLabel)}
    </span>
  );
}

function MobileRow({ row, highlight }: { row: GroupStandingRow; highlight: boolean }) {
  const gd =
    row.goalDifference > 0 ? `+${row.goalDifference}` : `${row.goalDifference}`;

  return (
    <div
      className={cn(
        "px-4 py-3.5 border-b border-white/[0.06] last:border-b-0",
        highlight && "bg-accent/8"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="font-display font-bold text-white/45 text-sm w-4 pt-1 tabular-nums shrink-0">
          {row.position}
        </span>
        <TeamFlag name={row.name} code={row.code} flag_url={row.flag_url} size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("font-semibold text-sm leading-tight", highlight && "text-accent")}>
              {row.name}
            </p>
            <div className="text-right shrink-0">
              <p className="font-display font-black text-xl tabular-nums leading-none">{row.points}</p>
              <p className="text-[9px] uppercase tracking-wider text-white/35 mt-0.5">Pts</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-2">
            <span className="text-xs text-white/45 tabular-nums">
              P {row.played} · {row.won}W {row.drawn}D {row.lost}L
            </span>
            <span className="text-xs text-white/45 tabular-nums">
              {row.goalsFor}:{row.goalsAgainst} · GD {gd}
            </span>
          </div>
          <div className="mt-2">
            <StatusBadge row={row} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopRow({
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
      <td className={cn("py-2.5 pl-3 font-display font-bold tabular-nums text-white/50", compact ? "w-8" : "w-10")}>
        {row.position}
      </td>
      <td className="py-2.5 pr-2">
        <div className="flex items-center gap-2 min-w-0">
          <TeamFlag name={row.name} code={row.code} flag_url={row.flag_url} size={compact ? 20 : 24} />
          <span className={cn("font-medium", compact ? "text-xs" : "text-sm", highlight && "text-accent")}>
            {row.name}
          </span>
        </div>
      </td>
      <td className="py-2.5 px-1 text-center tabular-nums text-white/70 text-sm">{row.played}</td>
      {!compact && (
        <>
          <td className="py-2.5 px-1 text-center tabular-nums text-white/70 text-sm">{row.won}</td>
          <td className="py-2.5 px-1 text-center tabular-nums text-white/70 text-sm">{row.drawn}</td>
          <td className="py-2.5 px-1 text-center tabular-nums text-white/70 text-sm">{row.lost}</td>
        </>
      )}
      <td className="py-2.5 px-1 text-center tabular-nums text-white/70 text-sm">
        {row.goalsFor}:{row.goalsAgainst}
      </td>
      <td className="py-2.5 px-1 text-center tabular-nums font-semibold text-sm">{row.points}</td>
      <td className="py-2.5 pr-3 text-right">
        <StatusBadge row={row} />
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
    <div className="border border-white/[0.08] overflow-hidden h-full bg-[var(--theme-bg-elevated)]">
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold">Group {standings.group}</h3>
          <span className="text-[10px] uppercase tracking-wider text-white/35">
            {standings.matchesPlayed}/{standings.matchesTotal} played
            {standings.isComplete ? " · Final" : ""}
          </span>
        </div>
      )}

      {/* Mobile: card rows */}
      <div className="md:hidden divide-y divide-white/[0.06]">
        {standings.rows.map((row) => (
          <MobileRow
            key={row.teamId}
            row={row}
            highlight={highlights.has(row.name.toLowerCase())}
          />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className={cn("w-full", compact ? "table-fixed" : "min-w-[520px]")}>
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-white/35">
              <th className="py-2 pl-3 text-left font-semibold w-10">#</th>
              <th className="py-2 text-left font-semibold">Team</th>
              <th className="py-2 px-1 text-center font-semibold w-10">P</th>
              {!compact && (
                <>
                  <th className="py-2 px-1 text-center font-semibold w-10">W</th>
                  <th className="py-2 px-1 text-center font-semibold w-10">D</th>
                  <th className="py-2 px-1 text-center font-semibold w-10">L</th>
                </>
              )}
              <th className="py-2 px-1 text-center font-semibold w-14">GF:GA</th>
              <th className="py-2 px-1 text-center font-semibold w-10">Pts</th>
              <th className="py-2 pr-3 text-right font-semibold w-20">Status</th>
            </tr>
          </thead>
          <tbody>
            {standings.rows.map((row) => (
              <DesktopRow
                key={row.teamId}
                row={row}
                highlight={highlights.has(row.name.toLowerCase())}
                compact={compact}
              />
            ))}
          </tbody>
        </table>
      </div>

      {showFooter && (
        <p className="px-3 py-2.5 text-[10px] text-white/30 border-t border-white/[0.06] leading-relaxed">
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
      <p className="mt-5 text-xs text-white/30 text-center px-4">
        Top 2 per group qualify · Best 8 third-placed teams also advance
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
