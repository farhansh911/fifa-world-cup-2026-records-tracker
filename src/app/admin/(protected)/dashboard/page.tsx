import Link from "next/link";
import {
  getTournamentStats,
  getRecordsBroken,
  getRecordsCreated,
  getLiveMatches,
} from "@/lib/data";

export default async function AdminDashboardPage() {
  const [stats, broken, created, live] = await Promise.all([
    getTournamentStats(),
    getRecordsBroken(),
    getRecordsCreated(),
    getLiveMatches(),
  ]);

  const cards = [
    { label: "Matches Played", value: stats?.matches_played ?? 0, href: "/admin/matches" },
    { label: "Goals Scored", value: stats?.goals_scored ?? 0, href: "/admin/stats" },
    { label: "Records Broken", value: broken.length, href: "/admin/records/broken" },
    { label: "New Records", value: created.length, href: "/admin/records/new" },
    { label: "Live Matches", value: live.length, href: "/admin/matches" },
    { label: "Teams", value: stats?.teams_participating ?? 0, href: "/admin/teams" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-black mb-8">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="glass glass-hover rounded-2xl p-6">
            <div className="text-3xl font-black text-accent">{card.value}</div>
            <div className="text-white/50 text-sm mt-1">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/records/broken" className="px-4 py-2 rounded-lg bg-secondary/20 text-secondary text-sm font-medium hover:bg-secondary/30">
            Add Broken Record
          </Link>
          <Link href="/admin/matches" className="px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm font-medium hover:bg-accent/30">
            Update Match
          </Link>
          <Link href="/admin/timeline" className="px-4 py-2 rounded-lg bg-highlight/20 text-highlight text-sm font-medium hover:bg-highlight/30">
            Add Timeline Event
          </Link>
          <Link href="/admin/stats" className="px-4 py-2 rounded-lg bg-primary/40 text-white text-sm font-medium hover:bg-primary/60">
            Refresh Tournament Stats
          </Link>
        </div>
      </div>
    </div>
  );
}
