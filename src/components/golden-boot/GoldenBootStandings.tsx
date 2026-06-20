import Link from "next/link";
import { PlayerPhoto } from "@/components/players/PlayerPhoto";
import { TeamFlag } from "@/components/matches/TeamFlag";
import { cn } from "@/lib/utils";
import type { GoldenBootEntry } from "@/lib/golden-boot";

interface GoldenBootStandingsProps {
  standings: GoldenBootEntry[];
}

export function GoldenBootStandings({ standings }: GoldenBootStandingsProps) {
  const withGoals = standings.filter((s) => s.goals > 0);

  if (withGoals.length === 0) {
    return (
      <p className="card p-10 text-center text-white/35 text-sm">Standings will appear once players score.</p>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-white/35">
              <th className="text-left py-3 px-4 font-semibold w-12">#</th>
              <th className="text-left py-3 px-4 font-semibold">Player</th>
              <th className="text-left py-3 px-4 font-semibold hidden sm:table-cell">Team</th>
              <th className="text-center py-3 px-3 font-semibold w-14">G</th>
              <th className="text-center py-3 px-3 font-semibold w-14 hidden md:table-cell">A</th>
              <th className="text-center py-3 px-3 font-semibold w-14 hidden lg:table-cell">MP</th>
              <th className="text-center py-3 px-3 font-semibold w-16 hidden lg:table-cell">G/M</th>
              <th className="text-center py-3 px-3 font-semibold w-16 hidden md:table-cell">Gap</th>
            </tr>
          </thead>
          <tbody>
            {withGoals.map((entry) => (
              <tr
                key={entry.athleteId}
                className={cn(
                  "border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02]",
                  entry.isLeader && "bg-highlight/[0.04]"
                )}
              >
                <td className="py-3 px-4 tabular-nums text-white/40 font-medium">{entry.rank}</td>
                <td className="py-3 px-4">
                  <Link
                    href={`/players/${entry.playerId}`}
                    className="flex items-center gap-3 group min-w-[180px]"
                  >
                    <PlayerPhoto
                      name={entry.name}
                      photoUrl={entry.photoUrl}
                      size={36}
                    />
                    <span className="font-medium truncate group-hover:text-accent transition-colors">
                      {entry.name}
                    </span>
                  </Link>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <div className="flex items-center gap-2 text-white/45">
                    <TeamFlag
                      name={entry.team}
                      code={entry.teamCode}
                      flag_url={entry.flagUrl}
                      size={22}
                    />
                    <span className="truncate max-w-[120px]">{entry.team}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={cn(
                      "font-display font-black tabular-nums",
                      entry.isLeader ? "text-highlight text-lg" : "text-white"
                    )}
                  >
                    {entry.goals}
                  </span>
                </td>
                <td className="py-3 px-3 text-center tabular-nums text-white/45 hidden md:table-cell">
                  {entry.assists}
                </td>
                <td className="py-3 px-3 text-center tabular-nums text-white/45 hidden lg:table-cell">
                  {entry.matches}
                </td>
                <td className="py-3 px-3 text-center tabular-nums text-white/45 hidden lg:table-cell">
                  {entry.goalsPerMatch.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-center tabular-nums hidden md:table-cell">
                  {entry.gapToLeader === 0 ? (
                    <span className="text-highlight text-xs font-semibold">—</span>
                  ) : (
                    <span className="text-white/35">−{entry.gapToLeader}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
