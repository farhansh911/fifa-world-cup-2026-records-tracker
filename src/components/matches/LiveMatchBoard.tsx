"use client";

import Link from "next/link";
import { TeamFlag } from "@/components/matches/TeamFlag";
import { useLiveScores } from "@/components/providers/LiveScoresProvider";
import { cn } from "@/lib/utils";
import type { LiveMatchView } from "@/lib/live-matches";

interface LiveMatchBoardProps {
  initialLive?: LiveMatchView[];
  initialFeatured?: LiveMatchView | null;
  compact?: boolean;
}

function StatBar({
  label,
  home,
  away,
  suffix = "",
}: {
  label: string;
  home: number;
  away: number;
  suffix?: string;
}) {
  const total = home + away || 1;
  const homePct = (home / total) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs tabular-nums">
        <span className="font-semibold w-8 text-left">{home}{suffix}</span>
        <span className="text-white/40 uppercase tracking-wider text-[10px]">{label}</span>
        <span className="font-semibold w-8 text-right">{away}{suffix}</span>
      </div>
      <div className="flex h-1 overflow-hidden bg-white/[0.06]">
        <div className="bg-accent transition-all duration-500" style={{ width: `${homePct}%` }} />
        <div className="bg-white/20 flex-1" />
      </div>
    </div>
  );
}

function LiveMatchCard({ match }: { match: LiveMatchView }) {
  const isLive = match.status === "live";
  const homePoss = match.homeStats.possession;
  const awayPoss = match.awayStats.possession;

  return (
    <article
      className={cn(
        "overflow-hidden border border-white/[0.08] bg-[#0f0b18]",
        isLive && "ring-1 ring-red-500/40"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Live · {match.clock || `${match.minute}'`}
            </span>
          ) : (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
              {match.statusDetail}
            </span>
          )}
        </div>
        <span className="text-[11px] text-white/35 truncate max-w-[50%]">
          {match.stadium || match.venue}
        </span>
      </div>

      {/* Scoreboard */}
      <Link href={match.id.startsWith("espn-") ? "/matches" : `/matches/${match.id}`} className="block px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <TeamFlag name={match.home.name} code={match.home.code} flag_url={match.home.flag_url} size={48} />
            <span className="text-sm font-semibold text-center truncate w-full">{match.home.name}</span>
          </div>

          <div className="shrink-0 text-center px-2">
            <div className="font-display text-4xl sm:text-5xl font-black tabular-nums tracking-tight">
              {match.home.score}
              <span className="text-white/25 mx-1">–</span>
              {match.away.score}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <TeamFlag name={match.away.name} code={match.away.code} flag_url={match.away.flag_url} size={48} />
            <span className="text-sm font-semibold text-center truncate w-full">{match.away.name}</span>
          </div>
        </div>
      </Link>

      {/* Possession — Apple Sports style */}
      {(homePoss > 0 || awayPoss > 0) && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between text-xs mb-1.5 tabular-nums">
            <span className="font-bold">{homePoss}%</span>
            <span className="text-white/35 text-[10px] uppercase tracking-wider">Possession</span>
            <span className="font-bold">{awayPoss}%</span>
          </div>
          <div className="flex h-2 overflow-hidden">
            <div
              className="bg-accent transition-all duration-700"
              style={{ width: `${homePoss}%` }}
            />
            <div
              className="bg-white/25 transition-all duration-700"
              style={{ width: `${awayPoss}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-4">
        <StatBar label="Shots" home={match.homeStats.shots} away={match.awayStats.shots} />
        <StatBar label="On target" home={match.homeStats.shotsOnTarget} away={match.awayStats.shotsOnTarget} />
        <StatBar label="Corners" home={match.homeStats.corners} away={match.awayStats.corners} />
        <StatBar label="Fouls" home={match.homeStats.fouls} away={match.awayStats.fouls} />
      </div>

      {/* Goals */}
      {match.goals.length > 0 && (
        <div className="border-t border-white/[0.06] px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-white/35 mb-2">Goals</p>
          <ul className="space-y-1.5">
            {match.goals.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-accent font-bold tabular-nums shrink-0 w-8">{g.minute || "—"}</span>
                <span className="text-white/70">
                  <span className="text-white font-medium">{g.player}</span>
                  <span className="text-white/40 text-xs ml-1">({g.team})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export function LiveMatchBoard({ initialLive = [], initialFeatured = null, compact = false }: LiveMatchBoardProps) {
  const { live: polledLive, featured: polledFeatured, updatedAt: polledUpdatedAt } = useLiveScores();
  const live = polledLive.length > 0 ? polledLive : initialLive;
  const featured = polledLive.length > 0 ? null : polledFeatured ?? initialFeatured;
  const updatedAt = polledUpdatedAt;

  const hasLive = live.length > 0;
  const display = hasLive ? live : featured ? [featured] : [];

  if (display.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-white/35 text-sm mb-2">No live matches right now</p>
        <Link href="/matches" className="text-accent text-sm hover:underline">
          View full schedule →
        </Link>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasLive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold">
                {live.length} live match{live.length !== 1 ? "es" : ""}
              </span>
            </>
          ) : (
            <span className="text-sm font-semibold text-white/50">Latest result</span>
          )}
        </div>
        {updatedAt && (
          <span className="text-[10px] text-white/30">
            Updated {new Date(updatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className={cn("grid gap-4", !compact && "lg:grid-cols-2")}>
        {display.map((m) => (
          <LiveMatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}
