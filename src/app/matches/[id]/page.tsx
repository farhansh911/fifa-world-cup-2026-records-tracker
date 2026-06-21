import { notFound } from "next/navigation";
import Link from "next/link";
import { createMetadata } from "@/lib/seo";
import { MatchDetailScores } from "@/components/matches/MatchDetailScores";
import { MatchDetailStats } from "@/components/matches/MatchDetailStats";
import { GroupBadge } from "@/components/matches/GroupBadge";
import { LiveMatchBoard } from "@/components/matches/LiveMatchBoard";
import { getMatch, getMatchLiveView } from "@/lib/data";
import { MatchKickoffTime } from "@/components/matches/MatchKickoffTime";

export const revalidate = 15;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) return createMetadata({ title: "Match Not Found" });

  const title = `${match.home_team?.name} vs ${match.away_team?.name}`;
  return createMetadata({
    title,
    description: `World Cup 2026 match: ${title}`,
    path: `/matches/${id}`,
  });
}

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params;
  const [match, liveView] = await Promise.all([getMatch(id), getMatchLiveView(id)]);
  if (!match) notFound();

  const home = {
    name: match.home_team?.name ?? "TBD",
    code: match.home_team?.code ?? "?",
    flag_url: match.home_team?.flag_url ?? null,
  };
  const away = {
    name: match.away_team?.name ?? "TBD",
    code: match.away_team?.code ?? "?",
    flag_url: match.away_team?.flag_url ?? null,
  };

  const display = liveView ?? null;
  const isLive = (display?.status ?? match.status) === "live";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/matches" className="text-accent text-sm hover:underline mb-6 inline-block">
        ← Back to schedule
      </Link>

      {isLive && display && (
        <div className="mb-6">
          <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            Live · auto-refreshes every 15s
          </p>
          <LiveMatchBoard initialLive={[display]} compact />
        </div>
      )}

      <article className="card p-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <GroupBadge group={match.group_name} />
          {match.summary && (
            <span className="text-[10px] uppercase tracking-wider text-white/35">{match.summary}</span>
          )}
        </div>

        <MatchDetailScores
          matchId={match.id}
          home={home}
          away={away}
          initialStatus={match.status}
          initialHomeScore={display?.home.score ?? match.home_score}
          initialAwayScore={display?.away.score ?? match.away_score}
          initialClock={display?.clock}
        />

        <div className="space-y-3 text-sm text-white/55 border-t border-white/[0.08] pt-6">
          <MatchKickoffTime
            kickoffUtc={match.match_date}
            hostCity={match.host_city}
            variant="detailed"
            primaryClassName="text-sm text-white/55"
            secondaryClassName="text-xs"
          />
          {match.stadium && <p>Stadium: {match.stadium}</p>}
          {match.venue && <p>Venue: {match.venue}</p>}
          {match.attendance && <p>Attendance: {match.attendance.toLocaleString()}</p>}
        </div>

        {!isLive && <MatchDetailStats matchId={match.id} initialView={display} />}
      </article>
    </div>
  );
}
