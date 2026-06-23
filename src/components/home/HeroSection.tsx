"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { Calendar } from "lucide-react";
import { gsap, registerGsap } from "@/lib/gsap";
import { formatScoreLine } from "@/lib/team-aliases";
import { MatchKickoffTime } from "@/components/matches/MatchKickoffTime";
import { useLiveMatchOverlay } from "@/components/providers/LiveScoresProvider";
import { TeamFlag } from "@/components/matches/TeamFlag";
import { MatchScheduleModal } from "@/components/matches/MatchScheduleModal";
import type { RecordChase } from "@/lib/records-engine";
import type { ScheduleMatch } from "@/lib/matches";

export interface HeroStats {
  matches_played: number;
  goals_scored: number;
  records_broken: number;
  records_created: number;
}

export interface HeroMatch {
  id: string;
  home: { name: string; code: string; flag_url: string | null };
  away: { name: string; code: string; flag_url: string | null };
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  status: "live" | "scheduled" | "completed" | "postponed";
  matchDate?: string;
  hostCity?: string | null;
}

export interface HeroRecord {
  id: string;
  title: string;
  new_holder: string;
  new_value: string;
}

interface HeroSectionProps {
  stats: HeroStats;
  featuredMatch: HeroMatch | null;
  latestRecord: HeroRecord | null;
  recordChase: RecordChase | null;
  upcomingSchedule: ScheduleMatch[];
}

export function HeroSection({ stats, featuredMatch, latestRecord, recordChase, upcomingSchedule }: HeroSectionProps) {
  const container = useRef<HTMLElement>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const overlay = useLiveMatchOverlay(featuredMatch?.id ?? "");

  const displayMatch = featuredMatch
    ? {
        ...featuredMatch,
        status: overlay?.status ?? featuredMatch.status,
        homeScore: overlay?.home.score ?? featuredMatch.homeScore,
        awayScore: overlay?.away.score ?? featuredMatch.awayScore,
        minute: overlay?.minute ?? featuredMatch.minute,
      }
    : null;

  useGSAP(
    () => {
      registerGsap();
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero-tag", { opacity: 0, x: -20, duration: 0.5 })
        .from(".hero-line-inner", { y: "110%", duration: 0.75, stagger: 0.12 }, "-=0.2")
        .from(".hero-body", { opacity: 0, y: 24, duration: 0.55 }, "-=0.35")
        .from(".hero-btn", { opacity: 0, y: 16, duration: 0.45, stagger: 0.1 }, "-=0.25")
        .from(".hero-meta", { opacity: 0, duration: 0.5 }, "-=0.2")
        .from(".hero-panel", { opacity: 0, x: 32, duration: 0.65 }, "-=0.5")
        .from(".hero-panel-block", { opacity: 0, y: 16, duration: 0.45, stagger: 0.08 }, "-=0.4");
    },
    { scope: container }
  );

  return (
    <>
      <section ref={container} className="relative border-b border-white/[0.08] overflow-x-hidden">
        <div className="hero-grid-lines absolute inset-0 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-8 sm:gap-12 lg:gap-16 items-start min-w-0">
            <div className="min-w-0">
              <p className="hero-tag inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-accent mb-5 sm:mb-6">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="leading-snug">Tournament live · USA · Canada · Mexico</span>
              </p>

              <h1 className="font-display text-[2.25rem] sm:text-6xl lg:text-[3.5rem] xl:text-7xl font-black leading-[1.02] tracking-tight mb-5 sm:mb-6">
                {["World Cup 2026", "Record Tracker"].map((line) => (
                  <span key={line} className="block overflow-hidden pb-1">
                    <span className="hero-line-inner block">{line}</span>
                  </span>
                ))}
              </h1>

              <p className="hero-body text-base sm:text-xl text-white/55 leading-relaxed max-w-xl mb-8 sm:mb-10">
                Broken records, new milestones, live scores and stats — updated after every match.
              </p>

              <div className="flex flex-wrap gap-2.5 sm:gap-3 mb-8 sm:mb-12">
                <Link
                  href="/records/broken"
                  className="hero-btn inline-flex items-center px-5 sm:px-6 py-3 sm:py-3.5 bg-white text-[#0a0612] font-semibold text-sm hover:bg-white/90 transition-colors"
                >
                  View records
                </Link>
                <button
                  type="button"
                  onClick={() => setScheduleOpen(true)}
                  className="hero-btn inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 border border-white/20 text-white font-semibold text-sm hover:border-white/40 hover:bg-white/5 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Match schedule
                </button>
              </div>

              <div className="hero-meta flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/40 border-t border-white/[0.08] pt-6">
                <span>48 teams</span>
                <span>104 matches</span>
                <span>3 host nations</span>
              </div>
            </div>

            <aside className="hero-panel space-y-3 lg:pt-8 min-w-0">
              {displayMatch ? (
                <div className="hero-panel-block card p-4 sm:p-5 min-w-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 shrink-0">
                      {displayMatch.status === "live" ? (
                        <span className="text-red-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          Live now
                        </span>
                      ) : displayMatch.status === "scheduled" ? (
                        "Up next"
                      ) : (
                        "Latest result"
                      )}
                    </p>
                    {displayMatch.status === "live" && displayMatch.minute != null && (
                      <span className="text-sm font-bold text-red-400 tabular-nums">{displayMatch.minute}&apos;</span>
                    )}
                    {displayMatch.status === "scheduled" && displayMatch.matchDate && (
                      <MatchKickoffTime
                        kickoffUtc={displayMatch.matchDate}
                        hostCity={displayMatch.hostCity}
                        variant="dateTime"
                        className="text-[10px] sm:text-xs text-white/35 leading-tight sm:text-right"
                      />
                    )}
                  </div>

                  <Link href={`/matches/${displayMatch.id}`} className="block group min-w-0">
                    <div className="sm:hidden flex items-center justify-center gap-2.5 w-full">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <TeamFlag {...displayMatch.home} size={28} className="shrink-0" />
                        <span className="text-xs font-semibold">{displayMatch.home.code}</span>
                      </div>
                      <div className="shrink-0">
                        {displayMatch.status === "scheduled" ? (
                          <span className="text-xs text-white/30 font-medium leading-none">vs</span>
                        ) : (
                          <span className="font-display text-base font-bold tabular-nums leading-none">
                            {formatScoreLine(
                              displayMatch.status,
                              displayMatch.homeScore,
                              displayMatch.awayScore
                            ) ?? "—"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-semibold">{displayMatch.away.code}</span>
                        <TeamFlag {...displayMatch.away} size={28} className="shrink-0" />
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 min-w-0 w-full">
                      <div className="flex-1 flex items-center gap-1.5 min-w-0 justify-end">
                        <span className="text-sm font-medium truncate text-right group-hover:text-accent transition-colors">
                          {displayMatch.home.name}
                        </span>
                        <TeamFlag {...displayMatch.home} size={28} className="shrink-0" />
                      </div>

                      <div className="shrink-0 px-1 text-center">
                        {displayMatch.status === "scheduled" ? (
                          <span className="text-xs text-white/30 font-medium leading-none">vs</span>
                        ) : (
                          <span className="font-display text-lg sm:text-xl font-bold tabular-nums leading-none">
                            {formatScoreLine(
                              displayMatch.status,
                              displayMatch.homeScore,
                              displayMatch.awayScore
                            ) ?? "—"}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 flex items-center gap-1.5 min-w-0">
                        <TeamFlag {...displayMatch.away} size={28} className="shrink-0" />
                        <span className="text-sm font-medium truncate group-hover:text-accent transition-colors">
                          {displayMatch.away.name}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setScheduleOpen(true)}
                    className="mt-4 w-full py-2 text-xs font-medium text-accent border border-accent/20 hover:bg-accent/5 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    View full schedule
                  </button>
                </div>
              ) : (
                <div className="hero-panel-block card p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-2">Fixtures</p>
                  <p className="text-sm text-white/45 mb-3">No matches to show yet.</p>
                  <button
                    type="button"
                    onClick={() => setScheduleOpen(true)}
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    View schedule
                  </button>
                </div>
              )}

              {recordChase ? (
                <Link href="/records/broken" className="hero-panel-block block card card-hover p-4 sm:p-5 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-highlight mb-2">
                    {recordChase.status === "tied" ? "Record tied" : recordChase.status === "broken" ? "Record broken" : "Record chase"}
                  </p>
                  <p className="font-display font-bold text-base sm:text-lg leading-snug mb-3 line-clamp-2">
                    {recordChase.player} vs {recordChase.recordHolder}
                  </p>
                  <div className="flex items-end justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase text-white/35">Career WC goals</p>
                      <p className="font-display text-xl sm:text-2xl font-black text-accent tabular-nums">{recordChase.currentValue}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] uppercase text-white/35">Record</p>
                      <p className="font-display text-xl sm:text-2xl font-black text-white/45 tabular-nums">{recordChase.recordValue}</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed">
                    {recordChase.status === "chasing"
                      ? `${recordChase.goalsAway} goal${recordChase.goalsAway === 1 ? "" : "s"} behind the all-time mark`
                      : recordChase.explanation}
                  </p>
                </Link>
              ) : latestRecord ? (
                <Link href={`/records/broken/${latestRecord.id}`} className="hero-panel-block block card card-hover p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary mb-2">Latest record broken</p>
                  <p className="font-display font-bold leading-snug mb-2">{latestRecord.title}</p>
                  <p className="text-sm text-white/45">
                    <span className="text-accent font-semibold">{latestRecord.new_holder}</span>
                    {" · "}
                    {latestRecord.new_value}
                  </p>
                </Link>
              ) : (
                <div className="hero-panel-block card p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-2">Records</p>
                  <p className="text-sm text-white/45">No records broken yet.</p>
                </div>
              )}

              <div className="hero-panel-block grid grid-cols-2 gap-px bg-white/[0.08] border border-white/[0.08] min-w-0">
                {[
                  { label: "Matches", value: stats.matches_played },
                  { label: "Goals", value: stats.goals_scored },
                  { label: "Broken", value: stats.records_broken },
                  { label: "New", value: stats.records_created },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[var(--theme-bg-elevated)] p-3 sm:p-4 min-w-0">
                    <p className="font-display text-xl sm:text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/35 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <MatchScheduleModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        matches={upcomingSchedule}
        title="Upcoming matches"
      />
    </>
  );
}
