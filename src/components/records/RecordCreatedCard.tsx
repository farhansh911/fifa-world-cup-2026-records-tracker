import Link from "next/link";
import { formatRecordDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { ShareRecordButton } from "@/components/ui/ShareRecordButton";
import type { RecordCreated } from "@/types/database";

interface RecordCreatedCardProps {
  record: RecordCreated;
}

export function RecordCreatedCard({ record }: RecordCreatedCardProps) {
  const matchLabel = record.match
    ? `${record.match.home_team?.name || "?"} vs ${record.match.away_team?.name || "?"}`
    : null;

  return (
    <article className="card card-hover p-5 group">
      <Badge variant="new" className="mb-4">New record</Badge>

      <h3 className="font-display text-lg font-bold mb-2 group-hover:text-accent transition-colors">{record.title}</h3>

      <p className="mb-4">
        <span className="text-2xl font-black text-highlight">{record.value}</span>
        <span className="text-white/45 text-sm ml-2">— {record.holder}</span>
      </p>

      {record.description && (
        <p className="text-white/45 text-sm mb-4 line-clamp-2">{record.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-white/35 border-t border-white/[0.06] pt-3">
        <div>
          {matchLabel && <p>{matchLabel}</p>}
          <p>{formatRecordDate(record.event_date)}</p>
        </div>
        <div className="flex items-center gap-2">
          <ShareRecordButton title={record.title} text={`New record: ${record.title}`} />
          <Link href={`/records/new/${record.id}`} className="text-accent hover:underline">Details</Link>
        </div>
      </div>
    </article>
  );
}
