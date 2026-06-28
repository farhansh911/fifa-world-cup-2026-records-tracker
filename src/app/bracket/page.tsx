import { createMetadata } from "@/lib/seo";
import { PageBanner } from "@/components/layout/PageBanner";
import { BracketTabs } from "@/components/bracket/BracketTabs";
import { buildGroupStandings, isGroupStageComplete } from "@/lib/group-standings";
import { buildKnockoutBracketView } from "@/lib/bracket";
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
  const bracketMatches = buildKnockoutBracketView(matches, groups);
  const groupStageComplete = isGroupStageComplete(groups);

  const initialTab =
    params.tab === "groups"
      ? "groups"
      : params.tab === "bracket"
        ? "bracket"
        : groupStageComplete
          ? "bracket"
          : "groups";

  return (
    <>
      <PageBanner
        badge={groupStageComplete ? "Knockout" : "Groups"}
        title={groupStageComplete ? "Knockout bracket" : "Groups & bracket"}
        subtitle={
          groupStageComplete
            ? "Full Round of 32 path through to the final — group standings still available in the tab above."
            : "Standings, qualification status, and the full knockout path."
        }
      />
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        <BracketTabs
          groups={groups}
          bracketMatches={bracketMatches}
          initialTab={initialTab}
          initialGroup={params.group}
          groupStageComplete={groupStageComplete}
        />
      </div>
    </>
  );
}
