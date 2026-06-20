import type { GoldenBootWinner } from "@/lib/golden-boot";

interface GoldenBootHistoryProps {
  winners: GoldenBootWinner[];
  fontaineRecord: number;
  fontaineHolder: string;
}

export function GoldenBootHistory({ winners, fontaineRecord, fontaineHolder }: GoldenBootHistoryProps) {
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-2">
          Single-tournament record
        </p>
        <p className="font-display text-3xl font-black text-highlight tabular-nums">{fontaineRecord}</p>
        <p className="text-sm text-white/45 mt-1">{fontaineHolder} · Sweden 1958</p>
        <p className="text-xs text-white/35 mt-3 leading-relaxed">
          No player has matched Fontaine&apos;s 13 goals in one World Cup since 1958.
        </p>
      </div>

      <div className="card p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-4">
          Recent Golden Boot winners
        </p>
        <ul className="space-y-3">
          {winners.map((w) => (
            <li key={w.year} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium truncate">{w.player}</p>
                <p className="text-xs text-white/35">{w.country} · {w.year}</p>
              </div>
              <span className="font-display font-bold text-highlight tabular-nums shrink-0">{w.goals}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
