import { notFound } from "next/navigation";
import Link from "next/link";
import { createMetadata } from "@/lib/seo";
import { Badge } from "@/components/ui/Badge";
import { ShareRecordButton } from "@/components/ui/ShareRecordButton";
import { getRecordBroken, REVALIDATE_SECONDS } from "@/lib/data";
import { formatDate, getImportanceColor } from "@/lib/utils";

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const record = await getRecordBroken(id);
  if (!record) return createMetadata({ title: "Record Not Found" });

  return createMetadata({
    title: record.title,
    description: `${record.new_holder} broke ${record.title}: ${record.new_value} (previously ${record.old_value} by ${record.previous_holder})`,
    path: `/records/broken/${id}`,
  });
}

export default async function RecordBrokenDetailPage({ params }: Props) {
  const { id } = await params;
  const record = await getRecordBroken(id);
  if (!record) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/records/broken" className="text-accent text-sm hover:underline mb-6 inline-block">
        ← Back to Records Broken
      </Link>

      <article className="glass rounded-2xl p-8 gradient-border">
        <div className="flex items-center gap-3 mb-6">
          <Badge variant="broken">Broken</Badge>
          <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full border ${getImportanceColor(record.importance)}`}>
            {record.importance}
          </span>
          <ShareRecordButton
            title={record.title}
            text={`${record.new_holder} broke ${record.title}`}
          />
        </div>

        <h1 className="text-3xl font-black mb-8">{record.title}</h1>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="glass rounded-xl p-5">
            <p className="text-sm text-white/50 mb-2">Previous Record</p>
            <p className="font-bold text-lg">{record.previous_holder}</p>
            <p className="text-2xl font-black text-secondary line-through">{record.old_value}</p>
          </div>
          <div className="glass rounded-xl p-5 glow-accent">
            <p className="text-sm text-white/50 mb-2">New Record</p>
            <p className="font-bold text-lg">{record.new_holder}</p>
            <p className="text-2xl font-black text-accent">{record.new_value}</p>
          </div>
        </div>

        {record.explanation && (
          <div className="mb-8">
            <h2 className="font-semibold mb-2">Explanation</h2>
            <p className="text-white/70">{record.explanation}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-white/50">
          <span>Date: {formatDate(record.event_date)}</span>
          {record.match && (
            <Link href={`/matches/${record.match.id}`} className="text-accent hover:underline">
              View Match
            </Link>
          )}
        </div>
      </article>
    </div>
  );
}
