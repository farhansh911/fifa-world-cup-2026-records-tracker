import Link from "next/link";
import { formatScoreLine } from "@/lib/team-aliases";
import { cn } from "@/lib/utils";
import type { BracketMatch, BracketRound } from "@/lib/bracket";

function BracketMatchCard({ match }: { match: BracketMatch }) {
  const scoreLine =
    match.status === "completed"
      ? formatScoreLine("completed", match.homeScore, match.awayScore)
      : null;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-colors"
    >
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

      <div className="divide-y divide-white/[0.06]">
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-3 py-2.5 text-sm",
            match.winner === match.homeTeam && "bg-emerald-500/8 font-medium"
          )}
        >
          <span className={cn("truncate", match.isPlaceholder && match.homeTeam.startsWith("Group") && "text-white/45 italic")}>
            {match.homeTeam}
          </span>
          {scoreLine && <span className="font-display font-bold tabular-nums shrink-0">{match.homeScore}</span>}
        </div>
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-3 py-2.5 text-sm",
            match.winner === match.awayTeam && "bg-emerald-500/8 font-medium"
          )}
        >
          <span className={cn("truncate", match.isPlaceholder && match.awayTeam.startsWith("Group") && "text-white/45 italic")}>
            {match.awayTeam}
          </span>
          {scoreLine && <span className="font-display font-bold tabular-nums shrink-0">{match.awayScore}</span>}
        </div>
      </div>
    </Link>
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
    <div className="space-y-10">
      {rounds.map((round) => (
        <section key={round.key}>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/45 mb-4 flex items-center gap-2">
            {round.label}
            <span className="text-white/25 font-normal normal-case tracking-normal">
              ({round.matches.length} matches)
            </span>
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {round.matches.map((m) => (
              <BracketMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function BracketQualifiersSummary({ teams }: { teams: string[] }) {
  if (teams.length === 0) return null;

  return (
    <div className="card p-5 mb-8">
      <h3 className="text-sm font-semibold mb-3">Qualified for Round of 32</h3>
      <div className="flex flex-wrap gap-2">
        {teams.map((team) => (
          <span
            key={team}
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
          >
            {team}
          </span>
        ))}
      </div>
    </div>
  );
}
