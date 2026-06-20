import { createMetadata } from "@/lib/seo";
import { PageBanner } from "@/components/layout/PageBanner";
import { TeamCard } from "@/components/teams/TeamCard";
import { Reveal } from "@/components/animations/Reveal";
import { getTeams } from "@/lib/data";

export const revalidate = 60;

export const metadata = createMetadata({
  title: "World Cup 2026 Teams",
  description: "All teams at FIFA World Cup 2026.",
  path: "/teams",
});

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <>
      <PageBanner badge="Teams" title="Participating nations" subtitle="All 48 teams and their tournament stats." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {teams.length > 0 ? (
          <Reveal className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {teams.map((t) => <TeamCard key={t.id} team={t} />)}
          </Reveal>
        ) : (
          <p className="card p-12 text-center text-white/35 text-sm">No teams added yet.</p>
        )}
      </div>
    </>
  );
}
