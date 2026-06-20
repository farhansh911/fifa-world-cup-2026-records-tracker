"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  formatMatchDateTime,
  formatMatchTime,
  formatViewerDateTime,
  formatViewerTime,
  viewerDiffersFromStadium,
} from "@/lib/match-timezones";

interface MatchKickoffTimeProps {
  kickoffUtc: string;
  hostCity?: string | null;
  variant?: "time" | "dateTime" | "detailed";
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
}

export function MatchKickoffTime({
  kickoffUtc,
  hostCity,
  variant = "dateTime",
  className,
  primaryClassName,
  secondaryClassName,
}: MatchKickoffTimeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const stadiumLabel =
    variant === "time"
      ? formatMatchTime(kickoffUtc, hostCity)
      : formatMatchDateTime(kickoffUtc, hostCity);

  if (!mounted) {
    return (
      <span className={cn("tabular-nums", className, primaryClassName)} suppressHydrationWarning>
        {stadiumLabel}
      </span>
    );
  }

  const viewerLabel =
    variant === "time" ? formatViewerTime(kickoffUtc) : formatViewerDateTime(kickoffUtc);
  const showStadium = viewerDiffersFromStadium(kickoffUtc, hostCity);

  if (variant === "detailed") {
    return (
      <div className={cn("space-y-1", className)}>
        <p className={cn("tabular-nums", primaryClassName)} suppressHydrationWarning>
          {viewerLabel}
          <span className="text-white/40 font-normal"> · your time</span>
        </p>
        {showStadium && (
          <p className={cn("text-white/45 tabular-nums", secondaryClassName)} suppressHydrationWarning>
            {formatMatchDateTime(kickoffUtc, hostCity)}
            <span className="text-white/35"> · stadium</span>
          </p>
        )}
      </div>
    );
  }

  if (!showStadium) {
    return (
      <span className={cn("tabular-nums", className, primaryClassName)} suppressHydrationWarning>
        {viewerLabel}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex flex-col items-end gap-0.5 tabular-nums", className)}>
      <span className={primaryClassName} suppressHydrationWarning>
        {viewerLabel}
      </span>
      <span className={cn("text-white/30 text-[10px]", secondaryClassName)} suppressHydrationWarning>
        {stadiumLabel} stadium
      </span>
    </span>
  );
}
