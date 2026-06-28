import Link from "next/link";
import { LiveMatchBoardServer } from "@/components/matches/LiveMatchBoardServer";
import { HeroSection } from "@/components/home/HeroSection";
import { HomeScoringHub } from "@/components/home/HomeScoringHub";
import { StatsGrid } from "@/components/home/StatsGrid";
import { MatchCard } from "@/components/matches/MatchCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/animations/Reveal";
import { toScheduleMatch } from "@/lib/matches";
import type { Match } from "@/types/database";
import type { TournamentStats } from "@/types/database";
import {
  getTournamentStats,
  getLiveMatches,
  getUpcomingMatches,
  getFeaturedMatches,
  getCompletedMatches,
  getMatchSchedule,
  getRecordChases,
  getCareerGoalsRace,
} from "@/lib/data";
import { getGoldenBootRace } from "@/lib/golden-boot";
import type { HeroMatch } from "@/components/home/HeroSection";

export const revalidate = 60;

const emptyStats: TournamentStats = {
  id: "",
  matches_played: 0,
  goals_scored: 0,
  records_broken: 0,
  records_created: 0,
  teams_participating: 0,
  attendance_total: 0,
  updated_at: new Date().toISOString(),
};

async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("Data fetch failed:", error);
    return fallback;
  }
}

function toHeroMatch(match: Match): HeroMatch {
  return {
    id: match.id,
    home: {
      name: match.home_team?.name ?? "TBD",
      code: match.home_team?.code ?? "?",
      flag_url: match.home_team?.flag_url ?? null,
    },
    away: {
      name: match.away_team?.name ?? "TBD",
      code: match.away_team?.code ?? "?",
      flag_url: match.away_team?.flag_url ?? null,
    },
    homeScore: match.home_score,
    awayScore: match.away_score,
    minute: match.minute,
    status: match.status as HeroMatch["status"],
    matchDate: match.match_date,
    hostCity: match.host_city,
  };
}

export default async function HomePage() {
  const [
    stats,
    liveMatches,
    allUpcoming,
    featuredMatchSources,
    completedMatches,
    fullSchedule,
    recordChases,
    goldenBoot,
    careerRace,
  ] = await Promise.all([
    safeFetch(getTournamentStats, null),
    safeFetch(getLiveMatches, [] as Match[]),
    safeFetch(getUpcomingMatches, [] as Match[]),
    safeFetch(getFeaturedMatches, [] as Match[]),
    safeFetch(() => getCompletedMatches(3), [] as Match[]),
    safeFetch(getMatchSchedule, [] as Match[]),
    safeFetch(getRecordChases, []),
    safeFetch(getGoldenBootRace, {
      leaders: [],
      standings: [],
      totalScorers: 0,
      fontaineRecord: 13,
      fontaineHolder: "Just Fontaine",
      goalsToFontaine: null,
      recentWinners: [],
    }),
    safeFetch(getCareerGoalsRace, { holder: null, chasers: [], brokenRecord: null }),
  ]);

  const upcomingMatches = allUpcoming.slice(0, 3);
  const upcomingSchedule = fullSchedule.map(toScheduleMatch);

  const s = stats ?? emptyStats;

  const statItems = [
    { key: "matches_played", label: "Matches", value: s.matches_played, icon: "calendar" as const },
    { key: "goals_scored", label: "Goals", value: s.goals_scored, icon: "target" as const },
    { key: "records_broken", label: "Broken", value: s.records_broken, icon: "trophy" as const },
    { key: "records_created", label: "New records", value: s.records_created, icon: "trending" as const },
    { key: "teams_participating", label: "Teams", value: s.teams_participating, icon: "users" as const },
    { key: "attendance_total", label: "Attendance", value: s.attendance_total, icon: "chart" as const },
  ];

  const heroFeaturedMatches = featuredMatchSources.map(toHeroMatch);

  const heroRecordChase =
    recordChases.find((c) => c.benchmarkId === "career-goals" && c.status === "broken") ??
    recordChases.find((c) => c.benchmarkId === "career-goals" && c.status === "chasing") ??
    recordChases.find((c) => c.status === "broken" && c.benchmarkId === "tournaments-with-goal") ??
    recordChases.find((c) => c.status === "chasing" || c.status === "tied") ??
    null;

  const heroLatestRecord = careerRace.brokenRecord
    ? {
        id: careerRace.brokenRecord.id,
        title: careerRace.brokenRecord.title,
        new_holder: careerRace.brokenRecord.new_holder,
        new_value: careerRace.brokenRecord.new_value,
      }
    : null;

  return (
    <>
      <HeroSection
        stats={{
          matches_played: s.matches_played,
          goals_scored: s.goals_scored,
          records_broken: s.records_broken,
          records_created: s.records_created,
        }}
        featuredMatches={heroFeaturedMatches}
        latestRecord={heroLatestRecord}
        recordChase={heroRecordChase}
        upcomingSchedule={upcomingSchedule}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 border-b border-white/[0.06] overflow-x-clip min-w-0">
        <SectionHeading
          title="Live now"
          action={<Link href="/matches" className="text-sm text-white/45 hover:text-white transition-colors whitespace-nowrap">Match center →</Link>}
        />
        <LiveMatchBoardServer />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 overflow-x-clip min-w-0">
        <StatsGrid stats={statItems} />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 overflow-x-clip min-w-0">
        <SectionHeading
          title="Match center"
          action={<Link href="/matches" className="text-sm text-white/45 hover:text-white transition-colors whitespace-nowrap">All matches →</Link>}
        />

        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 min-w-0">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/35 mb-4">Upcoming</h3>
            <Reveal className="space-y-3">
              {upcomingMatches.length > 0 ? (
                upcomingMatches.map((m) => <MatchCard key={m.id} match={m} />)
              ) : (
                <p className="card p-8 text-center text-white/35 text-sm">No upcoming matches.</p>
              )}
            </Reveal>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/35 mb-4">Results</h3>
            <Reveal className="space-y-3">
              {completedMatches.length > 0 ? (
                completedMatches.map((m) => <MatchCard key={m.id} match={m} />)
              ) : (
                <p className="card p-8 text-center text-white/35 text-sm">No results yet.</p>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      <HomeScoringHub
        goldenBoot={goldenBoot}
        careerHolder={careerRace.holder}
        careerChasers={careerRace.chasers}
        careerBrokenRecord={careerRace.brokenRecord}
      />
    </>
  );
}
