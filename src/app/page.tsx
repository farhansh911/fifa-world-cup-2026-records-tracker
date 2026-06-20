import Link from "next/link";
import { LiveMatchBoardServer } from "@/components/matches/LiveMatchBoardServer";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsGrid } from "@/components/home/StatsGrid";
import { MatchCard } from "@/components/matches/MatchCard";
import { RecordBrokenCard } from "@/components/records/RecordBrokenCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/animations/Reveal";
import { toScheduleMatch } from "@/lib/matches";
import type { Match } from "@/types/database";
import type { RecordBroken } from "@/types/database";
import type { TournamentStats } from "@/types/database";
import {
  getTournamentStats,
  getLiveMatches,
  getUpcomingMatches,
  getNextMatch,
  getCompletedMatches,
  getMatchSchedule,
  getRecordsBroken,
  getRecordChases,
} from "@/lib/data";

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

export default async function HomePage() {
  const [stats, liveMatches, allUpcoming, nextMatch, completedMatches, recentRecords, fullSchedule, recordChases] =
    await Promise.all([
      safeFetch(getTournamentStats, null),
      safeFetch(getLiveMatches, [] as Match[]),
      safeFetch(getUpcomingMatches, [] as Match[]),
      safeFetch(getNextMatch, null),
      safeFetch(() => getCompletedMatches(3), [] as Match[]),
      safeFetch(getRecordsBroken, [] as RecordBroken[]),
      safeFetch(getMatchSchedule, [] as Match[]),
      safeFetch(getRecordChases, []),
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

  const featuredMatchSource = liveMatches[0] ?? nextMatch ?? upcomingMatches[0] ?? completedMatches[0] ?? null;

  const heroFeaturedMatch = featuredMatchSource
    ? {
        id: featuredMatchSource.id,
        home: {
          name: featuredMatchSource.home_team?.name ?? "TBD",
          code: featuredMatchSource.home_team?.code ?? "?",
          flag_url: featuredMatchSource.home_team?.flag_url ?? null,
        },
        away: {
          name: featuredMatchSource.away_team?.name ?? "TBD",
          code: featuredMatchSource.away_team?.code ?? "?",
          flag_url: featuredMatchSource.away_team?.flag_url ?? null,
        },
        homeScore: featuredMatchSource.home_score,
        awayScore: featuredMatchSource.away_score,
        minute: featuredMatchSource.minute,
        status: featuredMatchSource.status as "live" | "scheduled" | "completed" | "postponed",
        matchDate: featuredMatchSource.match_date,
        hostCity: featuredMatchSource.host_city,
      }
    : null;

  const heroRecordChase = recordChases.find((c) => c.benchmarkId === "career-goals") ?? recordChases[0] ?? null;

  const heroLatestRecord = recentRecords[0]
    ? {
        id: recentRecords[0].id,
        title: recentRecords[0].title,
        new_holder: recentRecords[0].new_holder,
        new_value: recentRecords[0].new_value,
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
        featuredMatch={heroFeaturedMatch}
        latestRecord={heroLatestRecord}
        recordChase={heroRecordChase}
        upcomingSchedule={upcomingSchedule}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-white/[0.06]">
        <SectionHeading
          title="Live now"
          action={<Link href="/matches" className="text-sm text-white/45 hover:text-white transition-colors">Match center →</Link>}
        />
        <LiveMatchBoardServer />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <StatsGrid stats={statItems} />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeading
          title="Match center"
          action={<Link href="/matches" className="text-sm text-white/45 hover:text-white transition-colors">All matches →</Link>}
        />

        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/35 mb-4">Upcoming</h3>
            <Reveal className="space-y-3">
              {upcomingMatches.length > 0 ? (
                upcomingMatches.map((m) => <MatchCard key={m.id} match={m} variant="upcoming" />)
              ) : (
                <p className="card p-8 text-center text-white/35 text-sm">No upcoming matches.</p>
              )}
            </Reveal>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/35 mb-4">Results</h3>
            <Reveal className="space-y-3">
              {completedMatches.length > 0 ? (
                completedMatches.map((m) => <MatchCard key={m.id} match={m} variant="completed" />)
              ) : (
                <p className="card p-8 text-center text-white/35 text-sm">No results yet.</p>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24 border-t border-white/[0.06]">
        <SectionHeading
          title="Latest records broken"
          action={<Link href="/records/broken" className="text-sm text-white/45 hover:text-white transition-colors">View all →</Link>}
        />
        {recentRecords.length > 0 ? (
          <Reveal className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentRecords.slice(0, 3).map((r) => (
              <RecordBrokenCard key={r.id} record={r} />
            ))}
          </Reveal>
        ) : (
          <p className="card p-10 text-center text-white/35 text-sm">
            Records will show here once the tournament gets underway.
          </p>
        )}
      </section>

    </>
  );
}
