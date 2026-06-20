import { createMetadata } from "@/lib/seo";
import { PageBanner } from "@/components/layout/PageBanner";
import { Reveal } from "@/components/animations/Reveal";
import { StatsChart } from "@/components/stats/StatsChart";
import { GoldenBootLeader } from "@/components/golden-boot/GoldenBootLeader";
import { GoldenBootStandings } from "@/components/golden-boot/GoldenBootStandings";
import { GoldenBootHistory } from "@/components/golden-boot/GoldenBootHistory";
import { getGoldenBootRace } from "@/lib/golden-boot";

export const revalidate = 60;

export const metadata = createMetadata({
  title: "World Cup 2026 Golden Boot Race",
  description: "Live Golden Boot standings — top goal scorers at FIFA World Cup 2026.",
  path: "/golden-boot",
});

export default async function GoldenBootPage() {
  const race = await getGoldenBootRace();

  const chartData = race.standings
    .filter((s) => s.goals > 0)
    .slice(0, 10)
    .map((s) => ({
      name: s.shortName || s.name.split(" ").pop() || s.name,
      value: s.goals,
    }));

  return (
    <>
      <PageBanner
        badge="Golden Boot"
        title="Golden Boot race"
        subtitle="Live top-scorer standings from World Cup 2026 — updated after every match."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_320px] gap-8 items-start">
          <div className="space-y-10">
            <Reveal>
              <GoldenBootLeader
                leaders={race.leaders}
                goalsToFontaine={race.goalsToFontaine}
                fontaineRecord={race.fontaineRecord}
                fontaineHolder={race.fontaineHolder}
              />
            </Reveal>

            {chartData.length > 0 && (
              <Reveal>
                <div className="card p-6">
                  <h2 className="font-display text-lg font-bold mb-4">Top scorers chart</h2>
                  <StatsChart data={chartData} color="#F5C542" type="bar" />
                </div>
              </Reveal>
            )}

            <section>
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-xl font-bold">Full standings</h2>
                  <p className="text-sm text-white/45 mt-1">
                    {race.totalScorers} player{race.totalScorers === 1 ? "" : "s"} with at least one goal
                  </p>
                </div>
              </div>
              <Reveal>
                <GoldenBootStandings standings={race.standings} />
              </Reveal>
            </section>
          </div>

          <aside className="lg:sticky lg:top-20">
            <Reveal>
              <GoldenBootHistory
                winners={race.recentWinners}
                fontaineRecord={race.fontaineRecord}
                fontaineHolder={race.fontaineHolder}
              />
            </Reveal>
          </aside>
        </div>
      </div>
    </>
  );
}
