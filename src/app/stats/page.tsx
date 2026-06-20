import { createMetadata } from "@/lib/seo";
import { PageBanner } from "@/components/layout/PageBanner";
import { StatsChart } from "@/components/stats/StatsChart";
import { Reveal } from "@/components/animations/Reveal";
import { getTeams, getTopScorers, getTopAssists, getAllMatches } from "@/lib/data";

export const revalidate = 60;

export const metadata = createMetadata({
  title: "World Cup 2026 Statistics",
  description: "Tournament stats from FIFA World Cup 2026.",
  path: "/stats",
});

export default async function StatsPage() {
  const [teams, topScorers, topAssists, matches] = await Promise.all([
    getTeams(), getTopScorers(10), getTopAssists(10), getAllMatches(),
  ]);

  const charts = [
    { title: "Goals per team", data: teams.filter((t) => t.goals_for > 0).sort((a, b) => b.goals_for - a.goals_for).slice(0, 10).map((t) => ({ name: t.code, value: t.goals_for })), color: "#00D9FF", type: "bar" as const },
    { title: "Top scorers", data: topScorers.map((p) => ({ name: p.name.split(" ").pop() || p.name, value: p.goals })), color: "#F5C542", type: "bar" as const },
    { title: "Top assists", data: topAssists.map((p) => ({ name: p.name.split(" ").pop() || p.name, value: p.assists })), color: "#E91E63", type: "bar" as const },
    { title: "Attendance", data: matches.filter((m) => m.attendance && m.status === "completed").sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()).map((m) => ({ name: new Date(m.match_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: m.attendance || 0 })), color: "#00D9FF", type: "line" as const },
  ];

  return (
    <>
      <PageBanner badge="Stats" title="Statistics" subtitle="Goals, assists, and attendance trends." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Reveal className="grid lg:grid-cols-2 gap-4">
          {charts.map((chart) => (
            <div key={chart.title} className="card p-6">
              <h2 className="font-display font-bold mb-4">{chart.title}</h2>
              <StatsChart data={chart.data} color={chart.color} type={chart.type} />
            </div>
          ))}
        </Reveal>
      </div>
    </>
  );
}
