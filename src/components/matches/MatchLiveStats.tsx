import { LiveMatchBoard } from "@/components/matches/LiveMatchBoard";
import type { LiveMatchView } from "@/lib/live-matches";

interface MatchLiveStatsProps {
  view: LiveMatchView;
}

function StatRow({ label, home, away, suffix = "" }: { label: string; home: number; away: number; suffix?: string }) {
  const total = home + away || 1;
  const homePct = (home / total) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm tabular-nums">
        <span className="font-semibold">{home}{suffix}</span>
        <span className="text-white/40 text-xs uppercase tracking-wider">{label}</span>
        <span className="font-semibold">{away}{suffix}</span>
      </div>
      <div className="flex h-1 bg-white/[0.06]">
        <div className="bg-accent" style={{ width: `${homePct}%` }} />
      </div>
    </div>
  );
}

export function MatchLiveStats({ view }: MatchLiveStatsProps) {
  const hp = view.homeStats.possession;
  const ap = view.awayStats.possession;

  return (
    <div className="mt-8 space-y-6 border-t border-white/[0.08] pt-8">
      <h2 className="font-display font-bold text-lg">Match stats</h2>

      {(hp > 0 || ap > 0) && (
        <div>
          <div className="flex justify-between text-sm mb-2 tabular-nums">
            <span className="font-bold">{hp}%</span>
            <span className="text-white/40 text-xs uppercase">Possession</span>
            <span className="font-bold">{ap}%</span>
          </div>
          <div className="flex h-2.5">
            <div className="bg-accent" style={{ width: `${hp}%` }} />
            <div className="bg-white/25" style={{ width: `${ap}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <StatRow label="Shots" home={view.homeStats.shots} away={view.awayStats.shots} />
        <StatRow label="On target" home={view.homeStats.shotsOnTarget} away={view.awayStats.shotsOnTarget} />
        <StatRow label="Corners" home={view.homeStats.corners} away={view.awayStats.corners} />
        <StatRow label="Fouls" home={view.homeStats.fouls} away={view.awayStats.fouls} />
        <StatRow label="Yellow cards" home={view.homeStats.yellowCards} away={view.awayStats.yellowCards} />
        <StatRow label="Saves" home={view.homeStats.saves} away={view.awayStats.saves} />
      </div>

      {view.goals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/35 mb-3">Goals</h3>
          <ul className="space-y-2">
            {view.goals.map((g, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-accent font-bold tabular-nums w-10 shrink-0">{g.minute || "—"}</span>
                <span>
                  <span className="font-medium">{g.player}</span>
                  <span className="text-white/40"> · {g.team}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
