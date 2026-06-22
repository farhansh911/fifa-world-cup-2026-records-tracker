import { GroupStandingsTable } from "@/components/groups/GroupStandingsTable";
import { getGroupStandingsForGroup } from "@/lib/group-standings";
import { getWorldCupMatches } from "@/lib/fixtures-api";

interface MatchGroupStandingsProps {
  group: string;
  homeTeam: string;
  awayTeam: string;
}

export async function MatchGroupStandings({ group, homeTeam, awayTeam }: MatchGroupStandingsProps) {
  const matches = await getWorldCupMatches();
  const standings = getGroupStandingsForGroup(matches, group);

  if (!standings || standings.rows.every((r) => r.played === 0)) {
    return null;
  }

  return (
    <section className="mt-8 pt-8 border-t border-white/[0.08]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/45">
          Group {group} standings
        </h2>
        <a href={`/bracket?tab=groups&group=${group}`} className="text-xs text-accent hover:underline">
          Full bracket →
        </a>
      </div>
      <GroupStandingsTable
        standings={standings}
        highlightTeams={[homeTeam, awayTeam]}
        showHeader={false}
      />
    </section>
  );
}
