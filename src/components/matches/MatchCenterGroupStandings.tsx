import Link from "next/link";
import { GroupStandingsTable } from "@/components/groups/GroupStandingsTable";
import type { GroupStandings } from "@/lib/group-standings";

interface MatchCenterGroupStandingsProps {
  standings: GroupStandings;
}

export function MatchCenterGroupStandings({ standings }: MatchCenterGroupStandingsProps) {
  return (
    <section className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/[0.08] min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-lg font-bold">Group {standings.group} standings</h2>
          <p className="text-sm text-white/40 mt-1 hidden sm:block">
            Qualification status — top 2 plus best third-placed teams advance
          </p>
        </div>
        <Link href={`/bracket?tab=groups&group=${standings.group}`} className="text-xs text-accent hover:underline shrink-0">
          All groups →
        </Link>
      </div>
      <GroupStandingsTable standings={standings} showFooter />
    </section>
  );
}
