import Link from "next/link";
import { formatScoreLine } from "@/lib/team-aliases";
import { cn } from "@/lib/utils";
import type { BracketMatch, BracketRound } from "@/lib/bracket";

function BracketMatchCard({ match, compact }: { match: BracketMatch; compact?: boolean }) {
  const scoreLine =
    match.status === "completed"
      ? formatScoreLine("completed", match.homeScore, match.awayScore)
      : null;

  return (
    <Link
      href={`/matches/${match.id}`}
      className={cn(
        "block rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-accent/25 transition-all shadow-sm",
        compact && "min-w-[200px]"
      )}
    >
      {!compact && (
        <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wider text-white/35 truncate">
            {match.stadium ?? "TBD venue"}
          </span>
          {match.status === "live" && (
            <span className="text-[10px] font-bold text-red-400 uppercase">Live</span>
          )}
          {match.status === "completed" && (
            <span className="text-[10px] text-white/35 uppercase">FT</span>
          )}
        </div>
      )}

      <div className="divide-y divide-white/[0.06]">
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-3 py-2 text-sm",
            compact && "py-1.5 text-xs",
            match.winner === match.homeTeam && "bg-emerald-500/8 font-medium"
          )}
        >
          <span
            className={cn(
              "truncate",
              match.isPlaceholder && match.homeTeam.startsWith("Group") && "text-white/45 italic"
            )}
          >
            {match.homeTeam}
          </span>
          {scoreLine && (
            <span className="font-display font-bold tabular-nums shrink-0">{match.homeScore}</span>
          )}
        </div>
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-3 py-2 text-sm",
            compact && "py-1.5 text-xs",
            match.winner === match.awayTeam && "bg-emerald-500/8 font-medium"
          )}
        >
          <span
            className={cn(
              "truncate",
              match.isPlaceholder && match.awayTeam.startsWith("Group") && "text-white/45 italic"
            )}
          >
            {match.awayTeam}
          </span>
          {scoreLine && (
            <span className="font-display font-bold tabular-nums shrink-0">{match.awayScore}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function KnockoutRoundColumn({ round }: { round: BracketRound }) {
  return (
    <div className="flex flex-col shrink-0 min-w-[220px]">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-3 text-center sticky top-0 bg-[#120822]/90 backdrop-blur py-2 z-10">
        {round.label}
      </h3>
      <div className="flex flex-col gap-4 justify-around flex-1 py-2">
        {round.matches.map((m) => (
          <div key={m.id} className="relative">
            <BracketMatchCard match={m} compact />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TournamentBracket({ rounds }: { rounds: BracketRound[] }) {
  if (rounds.length === 0) {
    return (
      <p className="card p-10 text-center text-white/35 text-sm">
        Knockout bracket fixtures are loaded — scores will fill in as the knockout stage begins.
      </p>
    );
  }

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-white mb-2">Knockout path</h2>
      <p className="text-sm text-white/40 mb-6">
        Scroll horizontally to follow each round from the Round of 32 to the final.
      </p>

      <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hidden lg:block">
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 px-4 py-6 min-w-max items-stretch">
            {rounds.map((round, i) => (
              <div key={round.key} className="flex items-stretch gap-6">
                <KnockoutRoundColumn round={round} />
                {i < rounds.length - 1 && (
                  <div className="flex items-center shrink-0 w-6">
                    <div className="w-full h-px bg-gradient-to-r from-accent/40 to-white/10" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile-friendly stacked view for smaller screens */}
      <div className="mt-8 space-y-10 lg:hidden">
        {rounds.map((round) => (
          <section key={`stack-${round.key}`}>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/45 mb-4">
              {round.label}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {round.matches.map((m) => (
                <BracketMatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
