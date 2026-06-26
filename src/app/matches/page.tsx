import { createMetadata } from "@/lib/seo";
import { PageBanner } from "@/components/layout/PageBanner";
import { MatchCenterTabs } from "@/components/matches/MatchCenterTabs";
import { LiveMatchBoardServer } from "@/components/matches/LiveMatchBoardServer";
import { toScheduleMatch } from "@/lib/matches";
import { getLiveMatches, getMatchSchedule, getCompletedMatches, getLiveMatchViews, getFeaturedMatchView, getGroupStandings } from "@/lib/data";

export const revalidate = 60;

export const metadata = createMetadata({
  title: "World Cup 2026 Match Center",
  description: "Live scores, fixtures, and results from FIFA World Cup 2026.",
  path: "/matches",
});

export default async function MatchesPage() {
  const [live, scheduleMatches, completed, liveViews, featuredView, groupStandings] = await Promise.all([
    getLiveMatches(),
    getMatchSchedule(),
    getCompletedMatches(50),
    getLiveMatchViews(),
    getFeaturedMatchView(),
    getGroupStandings(),
  ]);

  const schedule = scheduleMatches.map(toScheduleMatch);

  return (
    <>
      <PageBanner badge="Fixtures" title="Match center" subtitle="Full schedule, live scores, and results." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 overflow-x-clip min-w-0">
        <MatchCenterTabs
          schedule={schedule}
          live={live}
          completed={completed}
          groupStandings={groupStandings}
          liveViews={liveViews}
          featuredView={featuredView}
          defaultTab={liveViews.length > 0 ? "live" : "schedule"}
        />
      </div>
    </>
  );
}
