"use client";

import { useLiveMatchOverlay } from "@/components/providers/LiveScoresProvider";
import { MatchLiveStats } from "@/components/matches/MatchLiveStats";
import type { LiveMatchView } from "@/lib/live-matches";

interface MatchDetailStatsProps {
  matchId: string;
  initialView: LiveMatchView | null;
}

export function MatchDetailStats({ matchId, initialView }: MatchDetailStatsProps) {
  const overlay = useLiveMatchOverlay(matchId);
  const view = overlay ?? initialView;

  if (!view) return null;

  const hasStats =
    view.goals.length > 0 ||
    view.homeStats.shots > 0 ||
    view.awayStats.shots > 0 ||
    view.homeStats.possession > 0;

  if (!hasStats) return null;

  return <MatchLiveStats view={view} />;
}
