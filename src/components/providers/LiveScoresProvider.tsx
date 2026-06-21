"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LiveMatchView } from "@/lib/live-matches";

const POLL_MS = 12_000;

interface LiveApiResponse {
  live: LiveMatchView[];
  featured: LiveMatchView | null;
  updatedAt: string;
}

interface LiveScoresContextValue {
  live: LiveMatchView[];
  featured: LiveMatchView | null;
  updatedAt: string | null;
  getView: (matchId: string) => LiveMatchView | undefined;
}

const LiveScoresContext = createContext<LiveScoresContextValue | null>(null);

export function LiveScoresProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useState<LiveMatchView[]>([]);
  const [featured, setFeatured] = useState<LiveMatchView | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/live", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as LiveApiResponse;
      setLive(data.live);
      setFeatured(data.featured);
      setUpdatedAt(data.updatedAt);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const getView = useCallback(
    (matchId: string) =>
      live.find((m) => m.id === matchId) ??
      (featured?.id === matchId ? featured : undefined),
    [live, featured]
  );

  const value = useMemo(
    () => ({ live, featured, updatedAt, getView }),
    [live, featured, updatedAt, getView]
  );

  return <LiveScoresContext.Provider value={value}>{children}</LiveScoresContext.Provider>;
}

export function useLiveScores() {
  const ctx = useContext(LiveScoresContext);
  if (!ctx) {
    throw new Error("useLiveScores must be used within LiveScoresProvider");
  }
  return ctx;
}

export function useLiveMatchOverlay(matchId: string | undefined) {
  const { getView } = useLiveScores();
  return matchId ? getView(matchId) : undefined;
}
