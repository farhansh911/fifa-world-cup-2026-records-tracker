import { Fragment } from "react";
import { TeamFlag } from "@/components/matches/TeamFlag";
import {
  type BestThirdPlaceRow,
  type BestThirdStatus,
} from "@/lib/group-standings";
import { cn } from "@/lib/utils";

interface BestThirdPlaceTableProps {
  rows: BestThirdPlaceRow[];
  groupsLive?: boolean;
}

function statusBadge(row: BestThirdPlaceRow) {
  const styles: Record<BestThirdStatus, string> = {
    qualified: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    "on-course": "bg-amber-500/15 text-amber-400 border-amber-500/30",
    "can-qualify": "bg-sky-500/15 text-sky-400 border-sky-500/30",
    eliminated: "bg-red-500/10 text-red-400/70 border-red-500/20",
  };

  const short: Record<BestThirdStatus, string> = {
    qualified: "R32",
    "on-course": "3rd+",
    "can-qualify": "Alive",
    eliminated: "Out",
  };

  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide",
        styles[row.status]
      )}
      title={row.statusLabel}
    >
      {short[row.status]}
    </span>
  );
}

export function BestThirdPlaceTable({ rows, groupsLive = false }: BestThirdPlaceTableProps) {
  if (rows.length === 0) return null;

  const isLive = groupsLive;
  const onCourseCount = rows.filter((r) => r.inTopEight).length;

  return (
    <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-display text-base font-bold text-white">Best 8 third-placed teams</h3>
          {isLive && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
              Live — not final
            </span>
          )}
        </div>
        <p className="text-xs text-white/45 mt-1">
          Top 2 from each group plus the best eight third-placed sides reach the Round of 32. Ranked by
          points, then goal difference, then goals scored.
        </p>
        {isLive && (
          <p className="text-xs text-sky-400/90 mt-2 leading-relaxed">
            This table shows the current third-placed team from each group. Spots 1–8 are on course for
            now — teams below can still move up with remaining group games. Nothing is confirmed until
            all 12 groups finish.
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-white/35 border-b border-white/[0.06]">
              <th className="px-3 py-2 text-left font-semibold w-10">#</th>
              <th className="px-3 py-2 text-left font-semibold">Team</th>
              <th className="px-3 py-2 text-center font-semibold w-12">Grp</th>
              <th className="px-3 py-2 text-center font-semibold w-10">P</th>
              <th className="px-3 py-2 text-center font-semibold w-14">GD</th>
              <th className="px-3 py-2 text-center font-semibold w-12">Pts</th>
              <th className="px-3 py-2 text-right font-semibold w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const showCutoff = index === 8 && rows.length > 8;
              const gd =
                row.goalDifference > 0
                  ? `+${row.goalDifference}`
                  : `${row.goalDifference}`;

              return (
                <Fragment key={row.teamId}>
                  {showCutoff && (
                    <tr className="bg-white/[0.02]">
                      <td colSpan={7} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-400/90 text-center leading-snug">
                        {isLive
                          ? `Provisional cut-off — ${onCourseCount} on course for R32 (can still change)`
                          : `Cut-off — top 8 advance to Round of 32`}
                      </td>
                    </tr>
                  )}
                  <tr
                    className={cn(
                      "border-b border-white/[0.05] last:border-b-0",
                      row.inTopEight && row.status !== "eliminated"
                        ? "bg-emerald-500/[0.04]"
                        : row.status === "can-qualify"
                          ? "bg-sky-500/[0.03]"
                          : undefined
                    )}
                  >
                    <td className="px-3 py-2.5 font-display font-bold tabular-nums text-white/50">
                      {row.rank}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <TeamFlag
                          name={row.name}
                          code={row.code}
                          flag_url={row.flag_url}
                          size={22}
                        />
                        <span className="font-medium text-white truncate">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-white/60 font-semibold">
                      {row.group}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums text-white/60">
                      {row.played}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums text-white/60">{gd}</td>
                    <td className="px-3 py-2.5 text-center font-display font-bold tabular-nums text-white">
                      {row.points}
                    </td>
                    <td className="px-3 py-2.5 text-right">{statusBadge(row)}</td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
