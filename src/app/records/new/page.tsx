import { createMetadata } from "@/lib/seo";
import { PageBanner } from "@/components/layout/PageBanner";
import { RecordCreatedCard } from "@/components/records/RecordCreatedCard";
import { Reveal } from "@/components/animations/Reveal";
import { getRecordsCreated } from "@/lib/data";

export const revalidate = 60;

export const metadata = createMetadata({
  title: "New World Cup 2026 Records",
  description: "New records created during FIFA World Cup 2026.",
  path: "/records/new",
});

export default async function RecordsNewPage() {
  const records = await getRecordsCreated();

  return (
    <>
      <PageBanner badge="New" title="New records" subtitle="First-time records set at World Cup 2026." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {records.length > 0 ? (
          <Reveal className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {records.map((r) => <RecordCreatedCard key={r.id} record={r} />)}
          </Reveal>
        ) : (
          <p className="card p-12 text-center text-white/35 text-sm">No new records yet.</p>
        )}
      </div>
    </>
  );
}
