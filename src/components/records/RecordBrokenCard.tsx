import Link from "next/link";
import { cn, getImportanceColor, formatRecordDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { ShareRecordButton } from "@/components/ui/ShareRecordButton";
import type { RecordBroken } from "@/types/database";

interface RecordBrokenCardProps {
  record: RecordBroken;
}

export function RecordBrokenCard({ record }: RecordBrokenCardProps) {
  const matchLabel = record.match
    ? `${record.match.home_team?.name || "?"} vs ${record.match.away_team?.name || "?"}`
    : null;

  return (
    <article className="card card-hover p-4 sm:p-5 group min-w-0">
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
        <Badge variant="broken">Broken</Badge>
        <span className={cn("text-[10px] font-semibold uppercase px-2 py-0.5 border", getImportanceColor(record.importance))}>
          {record.importance}
        </span>
      </div>

      <h3 className="font-display text-base sm:text-lg font-bold mb-3 sm:mb-4 group-hover:text-accent transition-colors leading-snug line-clamp-3">
        {record.title}
      </h3>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4 text-sm min-w-0">
        <div className="border border-white/[0.06] p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/35 mb-1">Was</p>
          <p className="font-medium truncate">{record.previous_holder}</p>
          <p className="text-secondary line-through font-bold mt-0.5">{record.old_value}</p>
        </div>
        <div className="border border-accent/20 p-3 bg-accent/[0.03]">
          <p className="text-[10px] uppercase tracking-wider text-white/35 mb-1">Now</p>
          <p className="font-medium truncate">{record.new_holder}</p>
          <p className="text-accent font-bold mt-0.5">{record.new_value}</p>
        </div>
      </div>

      {record.explanation && (
        <p className="text-white/45 text-sm mb-4 line-clamp-2">{record.explanation}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-white/35 border-t border-white/[0.06] pt-3 min-w-0">
        <div className="min-w-0">
          {matchLabel && <p className="truncate">{matchLabel}</p>}
          <p>{formatRecordDate(record.event_date)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ShareRecordButton title={record.title} text={`${record.new_holder} broke ${record.title}`} />
          <Link href={`/records/broken/${record.id}`} className="text-accent hover:underline">
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
