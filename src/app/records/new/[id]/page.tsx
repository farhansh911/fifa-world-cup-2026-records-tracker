import { notFound } from "next/navigation";
import Link from "next/link";
import { createMetadata } from "@/lib/seo";
import { Badge } from "@/components/ui/Badge";
import { ShareRecordButton } from "@/components/ui/ShareRecordButton";
import { getRecordCreated, REVALIDATE_SECONDS } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const record = await getRecordCreated(id);
  if (!record) return createMetadata({ title: "Record Not Found" });

  return createMetadata({
    title: record.title,
    description: `New record: ${record.title} — ${record.holder} with ${record.value}`,
    path: `/records/new/${id}`,
  });
}

export default async function RecordCreatedDetailPage({ params }: Props) {
  const { id } = await params;
  const record = await getRecordCreated(id);
  if (!record) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/records/new" className="text-accent text-sm hover:underline mb-6 inline-block">
        ← Back to New Records
      </Link>

      <article className="glass rounded-2xl p-8 glow-accent">
        <div className="flex items-center gap-3 mb-6">
          <Badge variant="new">New Record</Badge>
          <ShareRecordButton title={record.title} text={`New record: ${record.title}`} />
        </div>

        <h1 className="text-3xl font-black mb-4">{record.title}</h1>

        <div className="mb-8">
          <span className="text-4xl font-black text-highlight">{record.value}</span>
          <span className="text-white/60 ml-3 text-lg">by {record.holder}</span>
        </div>

        {record.description && (
          <div className="mb-8">
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="text-white/70">{record.description}</p>
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
