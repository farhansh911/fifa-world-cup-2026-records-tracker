import { cn, getImportanceColor } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { RecordChase } from "@/lib/records-engine";

interface RecordChaseCardProps {
  chase: RecordChase;
}

export function RecordChaseCard({ chase }: RecordChaseCardProps) {
  const progress = Math.min(100, (chase.currentValue / chase.recordValue) * 100);

  return (
    <article className="card card-hover p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <Badge
          variant={chase.status === "broken" ? "broken" : chase.status === "tied" ? "new" : "default"}
        >
          {chase.status === "broken" ? "Broken" : chase.status === "tied" ? "Tied" : "Chasing"}
        </Badge>
        <span className={cn("text-[10px] font-semibold uppercase px-2 py-0.5 border", getImportanceColor(chase.importance))}>
          {chase.importance}
        </span>
      </div>

      <h3 className="font-display text-lg font-bold mb-1 leading-snug">{chase.title}</h3>
      <p className="text-sm text-white/45 mb-4">{chase.player} · {chase.team}</p>

      <div className="flex items-end justify-between gap-4 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/35 mb-1">Current</p>
          <p className="font-display text-3xl font-black text-accent tabular-nums">{chase.currentValue}</p>
          <p className="text-xs text-white/40 mt-1">{chase.tournamentGoals} at WC 2026</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-white/35 mb-1">Record · {chase.recordHolder}</p>
          <p className="font-display text-3xl font-black text-white/50 tabular-nums">{chase.recordValue}</p>
          {chase.status === "chasing" && (
            <p className="text-xs text-highlight mt-1">{chase.goalsAway} to go</p>
          )}
        </div>
      </div>

      <div className="h-1.5 bg-white/[0.06] overflow-hidden mb-4">
        <div
          className={cn(
            "h-full transition-all",
            chase.status === "broken" ? "bg-secondary" : chase.status === "tied" ? "bg-highlight" : "bg-accent"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-sm text-white/50 leading-relaxed">{chase.explanation}</p>
    </article>
  );
}
