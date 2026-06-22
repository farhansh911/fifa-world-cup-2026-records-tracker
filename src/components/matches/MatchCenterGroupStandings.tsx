import Link from "next/link";
import { GroupStandingsTable } from "@/components/groups/GroupStandingsTable";
import type { GroupStandings } from "@/lib/group-standings";

interface MatchCenterGroupStandingsProps {
  standings: GroupStandings;
}

export function MatchCenterGroupStandings({ standings }: MatchCenterGroupStandingsProps) {
  return (
    <section className="mt-10 pt-8 border-t border-white/[0.08]">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display text-lg font-bold">Group {standings.group} standings</h2>
          <p className="text-sm text-white/40 mt-1">
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
