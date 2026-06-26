"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { WorldCupTrophy } from "@/components/graphics/WorldCupTrophy";
import { TeamFlag } from "@/components/matches/TeamFlag";
import type { GroupStandings, GroupStandingRow } from "@/lib/group-standings";
import type { BracketViewMatch } from "@/lib/bracket";
import {
  BRACKET_FINAL,
  BRACKET_LEFT_QF,
  BRACKET_LEFT_R16,
  BRACKET_LEFT_R32,
  BRACKET_RIGHT_QF,
  BRACKET_RIGHT_R16,
  BRACKET_RIGHT_R32,
  BRACKET_SF1,
  BRACKET_SF2,
  BRACKET_THIRD,
  LEFT_GROUPS,
  RIGHT_GROUPS,
  groupAccentBorder,
  groupAccentLabel,
  type KnockoutSlotDisplay,
} from "@/lib/bracket-slots";
import { cn } from "@/lib/utils";

interface WorldCupBracketProps {
  groups?: GroupStandings[];
  bracket?: Map<number, BracketViewMatch>;
}

function SlotLine({
  slot,
  score,
  mobile,
}: {
  slot: KnockoutSlotDisplay;
  score?: number | null;
  mobile?: boolean;
}) {
  const label = slot.team ?? slot.code;
  const isCode = !slot.team;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-b border-white/[0.08] last:border-b-0",
        mobile
          ? "px-3 py-2.5 min-h-[44px] text-sm"
          : "px-2 py-1 min-h-[24px] text-[10px]",
        slot.resolved && "bg-emerald-500/[0.08]"
      )}
    >
      <span
        className={cn(
          "truncate font-medium leading-tight",
          isCode ? "text-white/45 italic" : "text-white"
        )}
      >
        {label}
      </span>
      {score != null && (
        <span
          className={cn(
            "font-display font-bold tabular-nums text-white/90 shrink-0",
            mobile ? "text-base" : "text-[10px]"
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function MatchBox({ match, mobile }: { match?: BracketViewMatch; mobile?: boolean }) {
  if (!match) {
    return (
      <div
        className={cn(
          "rounded-md border border-white/10 bg-white/[0.04]",
          mobile ? "h-[92px]" : "h-[50px]"
        )}
      />
    );
  }

  return (
    <Link
      href={`/matches/${match.id}`}
      className={cn(
        "block rounded-md border border-white/20 bg-[#3a3a3e]/90 hover:border-white/35 active:border-accent/40 transition-colors overflow-hidden",
        mobile && "shadow-sm"
      )}
    >
      {mobile && (
        <div className="px-3 py-1.5 bg-white/[0.05] border-b border-white/[0.08] flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/45">
            Match {match.matchNumber}
          </span>
          {match.status === "live" && (
            <span className="text-[10px] font-bold text-red-400 uppercase">Live</span>
          )}
          {match.status === "completed" && (
            <span className="text-[10px] font-bold text-white/40 uppercase">FT</span>
          )}
        </div>
      )}
      <SlotLine slot={match.home} score={match.status === "completed" ? match.homeScore : null} mobile={mobile} />
      <SlotLine slot={match.away} score={match.status === "completed" ? match.awayScore : null} mobile={mobile} />
    </Link>
  );
}

function MatchColumn({
  label,
  numbers,
  bracket,
  width = "w-[92px]",
}: {
  label: string;
  numbers: number[];
  bracket: Map<number, BracketViewMatch>;
  width?: string;
}) {
  return (
    <div className={cn("flex flex-col shrink-0 h-full", width)}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-white/40 text-center mb-2 leading-tight px-0.5">
        {label}
      </p>
      <div className="flex flex-col justify-around flex-1 gap-1 min-h-0">
        {numbers.map((n) => (
          <MatchBox key={n} match={bracket.get(n)} />
        ))}
      </div>
    </div>
  );
}

function GroupPanel({ group, standings }: { group: string; standings?: GroupStandings }) {
  const rows = standings?.rows ?? [];
  const accent = groupAccentBorder(group);
  const labelColor = groupAccentLabel(group);
  const flagSlots: (GroupStandingRow | null)[] = [
    rows[0] ?? null,
    rows[1] ?? null,
    rows[2] ?? null,
    rows[3] ?? null,
  ];

  return (
    <div className={cn("rounded-lg border-2 bg-[#141414] overflow-hidden shrink-0 w-[72px]", accent)}>
      <div className="grid grid-cols-2 gap-1 p-1.5">
        {flagSlots.map((row, i) =>
          row ? (
            <div key={row.teamId} className="flex items-center justify-center">
              <TeamFlag name={row.name} code={row.code} flag_url={row.flag_url} size={26} />
            </div>
          ) : (
            <div key={`empty-${group}-${i}`} className="w-[26px] h-[26px] rounded-full bg-white/5 mx-auto" />
          )
        )}
      </div>
      <p className={cn("text-center text-[8px] font-black uppercase tracking-wide py-1 border-t border-white/[0.08]", labelColor)}>
        Group {group}
      </p>
    </div>
  );
}

function GroupsColumn({
  letters,
  groups,
}: {
  letters: string[];
  groups: GroupStandings[];
}) {
  const byGroup = new Map(groups.map((g) => [g.group.toUpperCase(), g]));

  return (
    <div className="flex flex-col gap-1 shrink-0 h-full justify-around py-1">
      {letters.map((letter) => (
        <GroupPanel key={letter} group={letter} standings={byGroup.get(letter)} />
      ))}
    </div>
  );
}

function PodiumSideSlot({
  slot,
  score,
  matchId,
  side,
  mobile,
}: {
  slot?: KnockoutSlotDisplay;
  score?: number | null;
  matchId?: string;
  side: "left" | "right";
  mobile?: boolean;
}) {
  const label = slot?.team ?? slot?.code ?? "";
  const isCode = !slot?.team;
  const empty = !label;

  const box = (
    <div
      className={cn(
        "flex flex-col justify-center rounded-md border border-white/20 bg-[#3a3a3e]/90 px-2 py-2 transition-colors",
        mobile ? "flex-1 min-w-0 min-h-[64px]" : "w-[72px] min-h-[56px]",
        slot?.resolved && "bg-emerald-500/[0.1] border-emerald-500/25",
        matchId && "hover:border-white/40 active:border-accent/40",
        side === "right" && "items-end text-right"
      )}
    >
      {empty ? (
        <span className="text-white/20 text-[10px]">—</span>
      ) : (
        <>
          <span
            className={cn(
              mobile ? "text-sm" : "text-[11px]",
              "font-semibold leading-tight truncate w-full",
              isCode ? "text-white/45 italic" : "text-white"
            )}
          >
            {label}
          </span>
          {score != null && (
            <span
              className={cn(
                "font-display font-bold tabular-nums text-white mt-0.5",
                mobile ? "text-lg" : "text-[12px]"
              )}
            >
              {score}
            </span>
          )}
        </>
      )}
    </div>
  );

  if (!matchId) {
    return (
      <div
        className={cn(
          "rounded-md border border-white/10 bg-white/[0.04]",
          mobile ? "flex-1 min-h-[64px]" : "w-[72px] min-h-[56px]"
        )}
      />
    );
  }

  return (
    <Link href={`/matches/${matchId}`} className={cn("block shrink-0", mobile && "flex-1 min-w-0")}>
      {box}
    </Link>
  );
}

/** FIFA poster centre: World Champions → trophy flanked by finalists → Bronze Winner. */
function CenterPodium({
  bracket,
  mobile,
}: {
  bracket: Map<number, BracketViewMatch>;
  mobile?: boolean;
}) {
  const finalMatch = bracket.get(BRACKET_FINAL);
  const thirdMatch = bracket.get(BRACKET_THIRD);

  const trophySize = mobile ? 88 : 112;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center shrink-0 px-2",
        mobile ? "w-full py-2" : "min-w-[260px] h-full self-stretch"
      )}
    >
      <p
        className={cn(
          "font-black uppercase tracking-[0.18em] text-white text-center leading-snug mb-3",
          mobile ? "text-sm" : "text-[11px] sm:text-xs"
        )}
      >
        World
        <br />
        Champions
      </p>

      <div className={cn("flex items-center justify-center w-full", mobile && "gap-2 px-1")}>
        <PodiumSideSlot
          side="left"
          mobile={mobile}
          slot={finalMatch?.home}
          score={finalMatch?.status === "completed" ? finalMatch.homeScore : null}
          matchId={finalMatch?.id}
        />
        <div className={cn("relative shrink-0 flex items-end justify-center", mobile ? "mx-1" : "mx-2 sm:mx-3")}>
          <div className="absolute inset-0 bg-highlight/15 blur-2xl rounded-full scale-110" />
          <WorldCupTrophy
            photo
            size={trophySize}
            className="relative"
          />
        </div>
        <PodiumSideSlot
          side="right"
          mobile={mobile}
          slot={finalMatch?.away}
          score={finalMatch?.status === "completed" ? finalMatch.awayScore : null}
          matchId={finalMatch?.id}
        />
      </div>

      {mobile && finalMatch && (
        <Link
          href={`/matches/${finalMatch.id}`}
          className="text-[11px] text-white/35 mt-2 hover:text-accent transition-colors"
        >
          Match {finalMatch.matchNumber} · Final
        </Link>
      )}

      <p
        className={cn(
          "font-bold uppercase tracking-[0.22em] text-white/75 mb-2",
          mobile ? "text-xs mt-6" : "text-[10px] mt-5"
        )}
      >
        Bronze Winner
      </p>

      <div className={cn("flex items-center justify-center w-full", mobile && "gap-2 px-1")}>
        <PodiumSideSlot
          side="left"
          mobile={mobile}
          slot={thirdMatch?.home}
          score={thirdMatch?.status === "completed" ? thirdMatch.homeScore : null}
          matchId={thirdMatch?.id}
        />
        <div
          className={cn("shrink-0", mobile ? "w-[88px] mx-1" : "w-[112px] mx-2 sm:mx-3")}
          aria-hidden
        />
        <PodiumSideSlot
          side="right"
          mobile={mobile}
          slot={thirdMatch?.away}
          score={thirdMatch?.status === "completed" ? thirdMatch.awayScore : null}
          matchId={thirdMatch?.id}
        />
      </div>

      {mobile && thirdMatch && (
        <Link
          href={`/matches/${thirdMatch.id}`}
          className="text-[11px] text-white/35 mt-2 hover:text-accent transition-colors"
        >
          Match {thirdMatch.matchNumber} · 3rd place
        </Link>
      )}

      <div className="mt-5 text-center select-none">
        <p className="font-display text-xl font-black text-highlight leading-none">26</p>
        <p className="text-[7px] uppercase tracking-[0.25em] text-white/45 mt-1">
          FIFA World Cup 2026
        </p>
      </div>
    </div>
  );
}

function MobileRoundSection({
  title,
  numbers,
  bracket,
}: {
  title: string;
  numbers: number[];
  bracket: Map<number, BracketViewMatch>;
}) {
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-wider text-white/45 mb-2.5 px-0.5">
        {title}
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {numbers.map((n) => (
          <MatchBox key={n} match={bracket.get(n)} mobile />
        ))}
      </div>
    </section>
  );
}

function MobileGroupsStrip({ groups }: { groups: GroupStandings[] }) {
  const letters = [...LEFT_GROUPS, ...RIGHT_GROUPS];

  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-wider text-white/45 mb-2.5 px-0.5">
        Groups
      </h3>
      <div className="overflow-x-auto pb-1 -mx-1">
        <div className="flex gap-2 px-1 min-w-max">
          {letters.map((letter) => (
            <GroupPanel
              key={letter}
              group={letter}
              standings={groups.find((g) => g.group.toUpperCase() === letter)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function MobileKnockoutBracket({
  groups,
  bracket,
}: {
  groups: GroupStandings[];
  bracket: Map<number, BracketViewMatch>;
}) {
  const r32 = [...BRACKET_LEFT_R32, ...BRACKET_RIGHT_R32];
  const r16 = [...BRACKET_LEFT_R16, ...BRACKET_RIGHT_R16];
  const qf = [...BRACKET_LEFT_QF, ...BRACKET_RIGHT_QF];

  return (
    <div className="lg:hidden p-3 sm:p-4 space-y-6">
      <CenterPodium bracket={bracket} mobile />
      <MobileRoundSection title="Semi-finals" numbers={[BRACKET_SF1, BRACKET_SF2]} bracket={bracket} />
      <MobileRoundSection title="Quarter-finals" numbers={qf} bracket={bracket} />
      <MobileRoundSection title="Round of 16" numbers={r16} bracket={bracket} />
      <MobileRoundSection title="Round of 32" numbers={r32} bracket={bracket} />
      <MobileGroupsStrip groups={groups} />
    </div>
  );
}

function DesktopKnockoutBracket({
  groups,
  bracket,
}: {
  groups: GroupStandings[];
  bracket: Map<number, BracketViewMatch>;
}) {
  return (
    <div className="hidden lg:block">
      <BracketFit>
        <div className="flex items-stretch gap-1.5 px-3 py-3 h-[660px]">
          <GroupsColumn letters={LEFT_GROUPS} groups={groups} />

          <div className="flex items-stretch gap-1.5 justify-end h-full">
            <MatchColumn label="Round of 32" numbers={BRACKET_LEFT_R32} bracket={bracket} width="w-[92px]" />
            <MatchColumn label="Round of 16" numbers={BRACKET_LEFT_R16} bracket={bracket} width="w-[86px]" />
            <MatchColumn label="Quarter-finals" numbers={BRACKET_LEFT_QF} bracket={bracket} width="w-[80px]" />
            <MatchColumn label="Semi-final" numbers={[BRACKET_SF1]} bracket={bracket} width="w-[80px]" />
          </div>

          <CenterPodium bracket={bracket} />

          <div className="flex items-stretch gap-1.5 justify-start h-full">
            <MatchColumn label="Semi-final" numbers={[BRACKET_SF2]} bracket={bracket} width="w-[80px]" />
            <MatchColumn label="Quarter-finals" numbers={BRACKET_RIGHT_QF} bracket={bracket} width="w-[80px]" />
            <MatchColumn label="Round of 16" numbers={BRACKET_RIGHT_R16} bracket={bracket} width="w-[86px]" />
            <MatchColumn label="Round of 32" numbers={BRACKET_RIGHT_R32} bracket={bracket} width="w-[92px]" />
          </div>

          <GroupsColumn letters={RIGHT_GROUPS} groups={groups} />
        </div>
      </BracketFit>
    </div>
  );
}

function BracketFit({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ scale: 1, width: 0, height: 0 });

  useLayoutEffect(() => {
    function fit() {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;

      inner.style.transform = "none";
      const availableW = outer.clientWidth;
      const availableH = outer.clientHeight;
      const neededW = inner.scrollWidth;
      const neededH = inner.scrollHeight;

      if (neededW === 0 || neededH === 0) return;

      const scale = Math.min(1, availableW / neededW, availableH / neededH);
      setLayout({
        scale,
        width: neededW * scale,
        height: neededH * scale,
      });
    }

    fit();
    const ro = new ResizeObserver(fit);
    if (outerRef.current) ro.observe(outerRef.current);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <div
      ref={outerRef}
      className="w-full overflow-hidden flex items-center justify-center"
      style={{ height: "min(78vh, 860px)", minHeight: 440 }}
    >
      <div
        style={{
          width: layout.width || undefined,
          height: layout.height || undefined,
        }}
      >
        <div
          ref={innerRef}
          style={{
            transform: `scale(${layout.scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function WorldCupBracket({ groups = [], bracket = new Map() }: WorldCupBracketProps) {
  const qualifiedCount = new Set(
    groups
      .flatMap((g) => g.rows)
      .filter((r) => r.qualification === "qualified" || r.qualification === "best-third")
      .map((r) => r.teamId)
  ).size;

  return (
    <section className="relative">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-black text-white">Knockout bracket</h2>
          <p className="text-xs text-white/40 mt-0.5 hidden sm:block">
            Codes like <span className="font-mono text-white/55">1A</span> until groups finish
          </p>
          <p className="text-[11px] text-white/35 mt-0.5 sm:hidden">
            Tap a match for details · scroll for all rounds
          </p>
        </div>
        <p className="text-xs text-white/35 tabular-nums">{qualifiedCount}/32 through or on course</p>
      </div>

      <div className="relative rounded-xl border border-white/10 bg-black overflow-hidden">
        <MobileKnockoutBracket groups={groups} bracket={bracket} />
        <DesktopKnockoutBracket groups={groups} bracket={bracket} />
      </div>
    </section>
  );
}
