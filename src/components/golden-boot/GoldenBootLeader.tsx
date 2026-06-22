import Link from "next/link";
import { Trophy } from "lucide-react";
import { PlayerPhoto } from "@/components/players/PlayerPhoto";
import { TeamFlag } from "@/components/matches/TeamFlag";
import type { GoldenBootEntry } from "@/lib/golden-boot";

interface GoldenBootLeaderProps {
  leaders: GoldenBootEntry[];
  goalsToFontaine: number | null;
  fontaineRecord: number;
  fontaineHolder: string;
}

function LeaderStats({ leader }: { leader: GoldenBootEntry }) {
  return (
    <p className="text-xs text-white/35 mt-1">
      {leader.matches} match{leader.matches === 1 ? "" : "es"}
      {leader.assists > 0 && ` · ${leader.assists} assist${leader.assists === 1 ? "" : "s"}`}
      {leader.goalsPerMatch > 0 && ` · ${leader.goalsPerMatch} gpg`}
    </p>
  );
}

export function GoldenBootLeader({
  leaders,
  goalsToFontaine,
  fontaineRecord,
  fontaineHolder,
}: GoldenBootLeaderProps) {
  if (leaders.length === 0) {
    return (
      <div className="card p-10 text-center">
        <Trophy className="w-10 h-10 text-highlight/40 mx-auto mb-4" strokeWidth={1.5} />
        <p className="text-white/45 text-sm">No goals scored yet — the Golden Boot race starts with the first match.</p>
      </div>
    );
  }

  const jointLead = leaders.length > 1;
  const soloLeader = leaders[0];

  return (
    <div className="card overflow-hidden border-highlight/20">
      <div className="bg-gradient-to-br from-highlight/10 via-transparent to-transparent px-6 py-5 border-b border-[var(--theme-border-subtle)]">
        <div className="flex items-center gap-2 text-highlight mb-1">
          <Trophy className="w-4 h-4" strokeWidth={2} />
          <span className="text-[10px] font-semibold uppercase tracking-widest">
            {jointLead ? "Joint leaders" : "Golden Boot leader"}
          </span>
        </div>
        <p className="text-sm text-white/45">
          {jointLead
            ? `${leaders.length} players tied on ${leaders[0].goals} goals`
            : `${soloLeader.goals} goal${soloLeader.goals === 1 ? "" : "s"} at World Cup 2026`}
        </p>
      </div>

      {!jointLead ? (
        <Link
          href={`/players/${soloLeader.playerId}`}
          className="group relative block overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--theme-bg-elevated)] via-[color-mix(in_srgb,var(--theme-bg-elevated)_92%,transparent)] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--theme-bg-elevated)] via-transparent to-transparent z-10 pointer-events-none md:hidden" />

          <div className="relative z-20 grid md:grid-cols-[1fr_220px] lg:grid-cols-[1fr_260px] items-end gap-6 p-6 sm:p-8">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-4 md:hidden">
                <PlayerPhoto
                  name={soloLeader.name}
                  photoUrl={soloLeader.photoUrl}
                  size={72}
                  priority
                />
                <TeamFlag
                  name={soloLeader.team}
                  code={soloLeader.teamCode}
                  flag_url={soloLeader.flagUrl}
                  size={28}
                />
              </div>

              <div className="hidden md:flex items-center gap-2 mb-4">
                <TeamFlag
                  name={soloLeader.team}
                  code={soloLeader.teamCode}
                  flag_url={soloLeader.flagUrl}
                  size={32}
                />
                <span className="text-sm text-white/45">{soloLeader.team}</span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-[var(--theme-fg)] group-hover:text-highlight transition-colors">
                {soloLeader.name}
              </h2>
              <p className="hidden md:block text-sm text-white/45 mt-2">{soloLeader.team}</p>
              <LeaderStats leader={soloLeader} />

              <div className="mt-6 flex items-end gap-3">
                <p className="font-display text-6xl sm:text-7xl font-black text-highlight tabular-nums leading-none">
                  {soloLeader.goals}
                </p>
                <p className="text-sm uppercase tracking-wider text-white/35 pb-2">goals</p>
              </div>
            </div>

            <div className="hidden md:flex justify-end items-end relative">
              <div className="absolute -bottom-8 -right-4 w-48 h-48 bg-highlight/10 rounded-full blur-3xl pointer-events-none" />
              <PlayerPhoto
                name={soloLeader.name}
                photoUrl={soloLeader.photoUrl}
                size={200}
                priority
                className="relative shadow-2xl shadow-black/20 ring-2 ring-highlight/25"
              />
            </div>
          </div>
        </Link>
      ) : (
        <div className="p-6 grid sm:grid-cols-2 gap-4">
          {leaders.map((leader) => (
            <Link
              key={leader.athleteId}
              href={`/players/${leader.playerId}`}
              className="card p-4 border-highlight/10 hover:border-highlight/25 transition-colors group overflow-hidden"
            >
              <div className="flex gap-4 items-start">
                <PlayerPhoto
                  name={leader.name}
                  photoUrl={leader.photoUrl}
                  size={64}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <TeamFlag
                      name={leader.team}
                      code={leader.teamCode}
                      flag_url={leader.flagUrl}
                      size={22}
                    />
                    <span className="text-xs text-white/35 truncate">{leader.team}</span>
                  </div>
                  <h2 className="font-display text-lg font-black truncate group-hover:text-highlight transition-colors">
                    {leader.name}
                  </h2>
                  <LeaderStats leader={leader} />
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-3xl font-black text-highlight tabular-nums">{leader.goals}</p>
                  <p className="text-[10px] uppercase tracking-wider text-white/35">goals</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {goalsToFontaine != null && goalsToFontaine >= 0 && (
        <div className="px-6 py-4 border-t border-[var(--theme-border-subtle)] bg-[color-mix(in_srgb,var(--theme-fg)_3%,transparent)] text-sm text-white/45">
          {goalsToFontaine === 0 ? (
            <span className="text-highlight font-medium">
              Level with {fontaineHolder}&apos;s single-tournament record ({fontaineRecord} goals)!
            </span>
          ) : (
            <>
              <span className="text-highlight font-medium">{goalsToFontaine}</span> behind{" "}
              {fontaineHolder}&apos;s single-tournament record ({fontaineRecord} goals, 1958)
            </>
          )}
        </div>
      )}
    </div>
  );
}
