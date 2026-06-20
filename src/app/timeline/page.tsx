import { createMetadata } from "@/lib/seo";
import { PageBanner } from "@/components/layout/PageBanner";
import { TimelineItem } from "@/components/timeline/TimelineItem";
import { Reveal } from "@/components/animations/Reveal";
import { getTimelineEvents } from "@/lib/data";

export const revalidate = 60;

export const metadata = createMetadata({
  title: "World Cup 2026 Timeline",
  description: "Goals, records, and milestones from World Cup 2026.",
  path: "/timeline",
});

export default async function TimelinePage() {
  const events = await getTimelineEvents();

  return (
    <>
      <PageBanner badge="Timeline" title="Tournament timeline" subtitle="Goals, records, and key moments." />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {events.length > 0 ? (
          <Reveal className="relative">
            <div className="timeline-line" />
            {events.map((event, i) => <TimelineItem key={event.id} event={event} index={i} />)}
          </Reveal>
        ) : (
          <p className="card p-12 text-center text-white/35 text-sm">No events yet.</p>
        )}
      </div>
    </>
  );
}
