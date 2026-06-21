"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { TeamFlag } from "@/components/matches/TeamFlag";
import { useLiveMatchOverlay } from "@/components/providers/LiveScoresProvider";
import { formatScoreLine } from "@/lib/team-aliases";

interface MatchDetailScoresProps {
  matchId: string;
  home: { name: string; code: string; flag_url: string | null };
  away: { name: string; code: string; flag_url: string | null };
  initialStatus: string;
  initialHomeScore: number | null;
  initialAwayScore: number | null;
  initialClock?: string | null;
}

export function MatchDetailScores({
  matchId,
  home,
  away,
  initialStatus,
  initialHomeScore,
  initialAwayScore,
  initialClock,
}: MatchDetailScoresProps) {
  const overlay = useLiveMatchOverlay(matchId);

  const status = overlay?.status ?? initialStatus;
  const homeScore = overlay?.home.score ?? initialHomeScore;
  const awayScore = overlay?.away.score ?? initialAwayScore;
  const isLive = status === "live";
  const clock = overlay?.clock ?? initialClock;

  return (
    <>
      <div className="flex justify-center mb-6">
        <Badge variant={isLive ? "live" : "default"}>
          {isLive && clock ? `Live · ${clock}` : status}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex-1 flex flex-col items-center gap-3">
          <TeamFlag {...home} size={56} />
          <div className="text-xl font-bold text-center">{home.name}</div>
          <div className="text-sm text-white/40">{home.code}</div>
        </div>

        <div className="font-display text-4xl sm:text-5xl font-black tabular-nums shrink-0">
          {status === "scheduled" && !overlay
            ? "vs"
            : formatScoreLine(status, homeScore, awayScore) ?? `${homeScore ?? 0}–${awayScore ?? 0}`}
        </div>

        <div className="flex-1 flex flex-col items-center gap-3">
          <TeamFlag {...away} size={56} />
          <div className="text-xl font-bold text-center">{away.name}</div>
          <div className="text-sm text-white/40">{away.code}</div>
        </div>
      </div>
    </>
  );
}
