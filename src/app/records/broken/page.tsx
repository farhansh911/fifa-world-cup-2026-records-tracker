import { createMetadata } from "@/lib/seo";
import { PageBanner } from "@/components/layout/PageBanner";
import { RecordBrokenCard } from "@/components/records/RecordBrokenCard";
import { RecordChaseCard } from "@/components/records/RecordChaseCard";
import { Reveal } from "@/components/animations/Reveal";
import { getRecordsBroken, getRecordChases } from "@/lib/data";

export const revalidate = 60;

export const metadata = createMetadata({
  title: "World Cup 2026 Broken Records Tracker",
  description: "Live tracking of all records broken during FIFA World Cup 2026.",
  path: "/records/broken",
});

export default async function RecordsBrokenPage() {
  const [records, chases] = await Promise.all([getRecordsBroken(), getRecordChases()]);

  const liveChases = chases.filter((c) => c.status === "chasing" || c.status === "tied");

  return (
    <>
      <PageBanner badge="Records" title="Records broken" subtitle="All-time and tournament records — detected automatically from live match data." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {liveChases.length > 0 && (
          <section className="mb-14">
            <h2 className="font-display text-xl font-bold mb-2">Live record chases</h2>
            <p className="text-sm text-white/45 mb-6">
              Live pursuit of all-time World Cup records — career goals, Fontaine&apos;s 13, assists, and more. Updates automatically after every match.
            </p>
            <Reveal className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveChases.map((c) => (
                <RecordChaseCard key={c.id} chase={c} />
              ))}
            </Reveal>
          </section>
        )}

        <h2 className="font-display text-xl font-bold mb-6">Broken &amp; equaled</h2>
        {records.length > 0 ? (
          <Reveal className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {records.map((r) => <RecordBrokenCard key={r.id} record={r} />)}
          </Reveal>
        ) : (
          <p className="card p-12 text-center text-white/35 text-sm">No records broken yet.</p>
        )}
      </div>
    </>
  );
}
