"use client";

import Link from "next/link";
import { TeamFlag } from "@/components/matches/TeamFlag";
import { useLiveScores } from "@/components/providers/LiveScoresProvider";
import { cn } from "@/lib/utils";
import { isInterruptedMatchStatus } from "@/lib/team-aliases";
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
  compact = false,
}: {
  label: string;
  home: number;
  away: number;
  suffix?: string;
  compact?: boolean;
}) {
  const total = home + away || 1;
  const homePct = (home / total) * 100;

  return (
    <div className={cn("space-y-1.5", compact && "space-y-1")}>
      <div className="flex items-center justify-between text-xs tabular-nums">
        <span className="font-semibold w-8 text-left">{home}{suffix}</span>
        <span className="text-white/40 uppercase tracking-wider text-[10px]">{label}</span>
        <span className="font-semibold w-8 text-right">{away}{suffix}</span>
      </div>
      <div className="flex h-1 overflow-hidden bg-white/[0.06] rounded-full">
        <div className="bg-accent transition-all duration-500 rounded-l-full" style={{ width: `${homePct}%` }} />
        <div className="bg-white/20 flex-1 rounded-r-full" />
      </div>
    </div>
  );
}

function MatchHeader({ match, isLive, interrupted }: { match: LiveMatchView; isLive: boolean; interrupted: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-2 min-w-0">
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-400 shrink-0">
            <span className={cn("w-1.5 h-1.5 rounded-full bg-red-400", !interrupted && "animate-pulse")} />
            {interrupted ? match.statusDetail : `Live · ${match.clock || `${match.minute}'`}`}
          </span>
        ) : (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40 shrink-0">
            {match.statusDetail}
          </span>
        )}
        {match.stadium && (
          <span className="text-[11px] text-white/35 truncate hidden sm:inline">· {match.stadium}</span>
        )}
      </div>
      {match.venue && (
        <span className="text-[11px] text-white/35 truncate shrink-0 max-w-[40%] hidden md:inline">
          {match.venue}
        </span>
      )}
    </div>
  );
}

function Scoreboard({ match, large = false }: { match: LiveMatchView; large?: boolean }) {
  const href = match.id.startsWith("espn-") ? "/matches" : `/matches/${match.id}`;

  return (
    <Link href={href} className="block group min-w-0">
      <div className={cn("flex items-center justify-between gap-2 sm:gap-4 min-w-0", large ? "py-1 sm:py-2" : "py-3 sm:py-4")}>
        <div className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-0">
          <TeamFlag
            name={match.home.name}
            code={match.home.code}
            flag_url={match.home.flag_url}
            size={large ? 48 : 40}
            className="sm:hidden"
          />
          <TeamFlag
            name={match.home.name}
            code={match.home.code}
            flag_url={match.home.flag_url}
            size={large ? 56 : 48}
            className="hidden sm:block"
          />
          <span className="font-semibold text-center truncate w-full group-hover:text-accent transition-colors px-1 text-xs sm:text-sm">
            <span className="sm:hidden">{match.home.code}</span>
            <span className="hidden sm:inline">{match.home.name}</span>
          </span>
        </div>

        <div className="shrink-0 text-center px-1 sm:px-2">
          <div className={cn("font-display font-black tabular-nums tracking-tight leading-none", large ? "text-3xl sm:text-5xl lg:text-6xl" : "text-2xl sm:text-4xl lg:text-5xl")}>
            {match.home.score}
            <span className="text-white/25 mx-0.5 sm:mx-1">–</span>
            {match.away.score}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-0">
          <TeamFlag
            name={match.away.name}
            code={match.away.code}
            flag_url={match.away.flag_url}
            size={large ? 48 : 40}
            className="sm:hidden"
          />
          <TeamFlag
            name={match.away.name}
            code={match.away.code}
            flag_url={match.away.flag_url}
            size={large ? 56 : 48}
            className="hidden sm:block"
          />
          <span className="font-semibold text-center truncate w-full group-hover:text-accent transition-colors px-1 text-xs sm:text-sm">
            <span className="sm:hidden">{match.away.code}</span>
            <span className="hidden sm:inline">{match.away.name}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function MatchStats({ match, columns = 1 }: { match: LiveMatchView; columns?: 1 | 2 }) {
  const homePoss = match.homeStats.possession;
  const awayPoss = match.awayStats.possession;

  return (
    <div className="space-y-4">
      {(homePoss > 0 || awayPoss > 0) && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5 tabular-nums">
            <span className="font-bold">{homePoss}%</span>
            <span className="text-white/35 text-[10px] uppercase tracking-wider">Possession</span>
            <span className="font-bold">{awayPoss}%</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full">
            <div className="bg-accent transition-all duration-700" style={{ width: `${homePoss}%` }} />
            <div className="bg-white/25 transition-all duration-700" style={{ width: `${awayPoss}%` }} />
          </div>
        </div>
      )}

      <div className={cn("gap-3", columns === 2 ? "grid sm:grid-cols-2 gap-x-6" : "space-y-3")}>
        <StatBar label="Shots" home={match.homeStats.shots} away={match.awayStats.shots} />
        <StatBar label="On target" home={match.homeStats.shotsOnTarget} away={match.awayStats.shotsOnTarget} />
        <StatBar label="Corners" home={match.homeStats.corners} away={match.awayStats.corners} />
        <StatBar label="Fouls" home={match.homeStats.fouls} away={match.awayStats.fouls} />
      </div>

      {match.goals.length > 0 && (
        <div className="border-t border-white/[0.06] pt-3">
          <p className="text-[10px] uppercase tracking-wider text-white/35 mb-2">Goals</p>
          <ul className={cn(columns === 2 && match.goals.length > 3 ? "grid sm:grid-cols-2 gap-x-4 gap-y-1.5" : "space-y-1.5")}>
            {match.goals.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm min-w-0">
                <span className="text-accent font-bold tabular-nums shrink-0 w-8">{g.minute || "—"}</span>
                <span className="text-white/70 truncate">
                  <span className="text-white font-medium">{g.player}</span>
                  <span className="text-white/40 text-xs ml-1">({g.team})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LiveMatchCard({ match, wide = false }: { match: LiveMatchView; wide?: boolean }) {
  const isLive = match.status === "live";
  const interrupted = isInterruptedMatchStatus(match.statusDetail);

  return (
    <article
      className={cn(
        "overflow-hidden border border-white/[0.08] bg-[var(--theme-bg-elevated)] h-full",
        isLive && "ring-1 ring-red-500/40"
      )}
    >
      <MatchHeader match={match} isLive={isLive} interrupted={interrupted} />

      {wide ? (
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
          <div className="px-4 sm:px-6 py-4 sm:py-6 flex flex-col justify-center min-w-0">
            <Scoreboard match={match} large />
          </div>
          <div className="px-4 sm:px-6 py-4 sm:py-6 min-w-0">
            <MatchStats match={match} columns={2} />
          </div>
        </div>
      ) : (
        <>
          <div className="px-3 sm:px-4 min-w-0">
            <Scoreboard match={match} />
          </div>
          {(match.homeStats.possession > 0 || match.homeStats.shots > 0 || match.goals.length > 0) && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-white/[0.06] pt-3 sm:pt-4 min-w-0">
              <MatchStats match={match} />
            </div>
          )}
        </>
      )}
    </article>
  );
}

function liveGridClass(count: number, compact: boolean): string {
  if (compact) return "grid gap-4 grid-cols-1";
  if (count === 1) return "grid gap-4 grid-cols-1";
  if (count === 2) return "grid gap-4 grid-cols-1 lg:grid-cols-2";
  if (count === 3) return "grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
  return "grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";
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

  const useWideCard = !compact && display.length === 1;

  return (
    <div className={compact ? "space-y-4 min-w-0" : "space-y-5 sm:space-y-6 min-w-0"}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {hasLive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-sm font-semibold">
                {live.length} live match{live.length !== 1 ? "es" : ""}
              </span>
            </>
          ) : (
            <span className="text-sm font-semibold text-white/50">Latest result</span>
          )}
        </div>
        {updatedAt && (
          <span className="text-[10px] text-white/30 shrink-0">
            Updated {new Date(updatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className={liveGridClass(display.length, compact || useWideCard)}>
        {display.map((m) => (
          <LiveMatchCard key={m.id} match={m} wide={useWideCard} />
        ))}
      </div>
    </div>
  );
}
