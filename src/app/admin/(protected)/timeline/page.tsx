import { getTimelineEvents } from "@/lib/data";
import { AdminTimelineClient } from "@/components/admin/AdminTimeline";

export default async function AdminTimelinePage() {
  const events = await getTimelineEvents();
  return <AdminTimelineClient events={events} />;
}
