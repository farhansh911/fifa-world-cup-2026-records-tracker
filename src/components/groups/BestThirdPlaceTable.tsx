import { Fragment } from "react";
import { TeamFlag } from "@/components/matches/TeamFlag";
import type { BestThirdPlaceRow } from "@/lib/group-standings";
import { cn } from "@/lib/utils";

interface BestThirdPlaceTableProps {
  rows: BestThirdPlaceRow[];
}

export function BestThirdPlaceTable({ rows }: BestThirdPlaceTableProps) {
  if (rows.length === 0) return null;

  const qualifying = rows.filter((r) => r.qualifies).length;

  return (
    <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-white/[0.08]">
        <h3 className="font-display text-base font-bold text-white">Best 8 third-placed teams</h3>
        <p className="text-xs text-white/45 mt-1">
          Top 2 from each group plus the best eight third-placed sides reach the Round of 32. Ranked by
          points, then goal difference, then goals scored.
        </p>
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
                      <td colSpan={7} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400/80 text-center">
                        Cut-off — top 8 advance ({qualifying}/8 filled)
                      </td>
                    </tr>
                  )}
                  <tr
                    className={cn(
                      "border-b border-white/[0.05] last:border-b-0",
                      row.qualifies ? "bg-emerald-500/[0.04]" : "opacity-80"
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
                    <td className="px-3 py-2.5 text-right">
                      {row.qualifies ? (
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide",
                            row.groupComplete
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          )}
                        >
                          {row.groupComplete ? "R32" : "3rd+"}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide bg-red-500/10 text-red-400/70 border-red-500/20">
                          Out
                        </span>
                      )}
                    </td>
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
