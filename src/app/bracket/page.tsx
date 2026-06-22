import { createMetadata } from "@/lib/seo";
import { PageBanner } from "@/components/layout/PageBanner";
import { BracketTabs } from "@/components/bracket/BracketTabs";
import { buildGroupStandings } from "@/lib/group-standings";
import { buildTournamentBracket, getQualifiedTeams } from "@/lib/bracket";
import { getWorldCupMatches } from "@/lib/fixtures-api";

export const revalidate = 60;

export const metadata = createMetadata({
  title: "World Cup 2026 Groups & Bracket",
  description: "Group standings, qualification tracker, and knockout bracket for FIFA World Cup 2026.",
  path: "/bracket",
});

interface Props {
  searchParams: Promise<{ tab?: string; group?: string }>;
}

export default async function BracketPage({ searchParams }: Props) {
  const params = await searchParams;
  const matches = await getWorldCupMatches();
  const groups = buildGroupStandings(matches);
  const rounds = buildTournamentBracket(matches);
  const qualifiedTeams = getQualifiedTeams(groups);

  const initialTab = params.tab === "bracket" ? "bracket" : "groups";

  return (
    <>
      <PageBanner
        badge="Knockout"
        title="Groups & bracket"
        subtitle="Standings, qualification status, and the full knockout path."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BracketTabs
          groups={groups}
          rounds={rounds}
          qualifiedTeams={qualifiedTeams}
          initialTab={initialTab}
          initialGroup={params.group}
        />
      </div>
    </>
  );
}
