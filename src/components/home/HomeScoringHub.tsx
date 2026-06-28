import Link from "next/link";
import { GoldenBootLeader } from "@/components/golden-boot/GoldenBootLeader";
import { GoldenBootStandings } from "@/components/golden-boot/GoldenBootStandings";
import { CareerGoalsRaceSection } from "@/components/records/CareerGoalsRaceSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/animations/Reveal";
import type { GoldenBootRace } from "@/lib/golden-boot";
import type { RecordBroken } from "@/types/database";
import type { RecordChase } from "@/lib/records-engine";

interface HomeScoringHubProps {
  goldenBoot: GoldenBootRace;
  careerHolder: RecordChase | null;
  careerChasers: RecordChase[];
  careerBrokenRecord: RecordBroken | null;
}

export function HomeScoringHub({
  goldenBoot,
  careerHolder,
  careerChasers,
  careerBrokenRecord,
}: HomeScoringHubProps) {
  const topStandings = goldenBoot.standings.filter((s) => s.goals > 0).slice(0, 5);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 pb-16 sm:pb-24 border-t border-white/[0.06] overflow-x-hidden min-w-0">
      <SectionHeading
        title="Goal scoring"
        action={
          <div className="flex items-center gap-4">
            <Link href="/golden-boot" className="text-sm text-white/45 hover:text-white transition-colors whitespace-nowrap">
              Golden Boot →
            </Link>
            <Link href="/records/broken" className="text-sm text-white/45 hover:text-white transition-colors whitespace-nowrap">
              All-time records →
            </Link>
          </div>
        }
      />

      <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 min-w-0">
        <div className="min-w-0 space-y-5">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/35 mb-4">
              Golden Boot · WC 2026
            </h3>
            <Reveal>
              <GoldenBootLeader
                leaders={goldenBoot.leaders}
                goalsToFontaine={goldenBoot.goalsToFontaine}
                fontaineRecord={goldenBoot.fontaineRecord}
                fontaineHolder={goldenBoot.fontaineHolder}
              />
            </Reveal>
          </div>
          {topStandings.length > 1 && (
            <Reveal>
              <GoldenBootStandings standings={topStandings} />
            </Reveal>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/35 mb-4">
            All-time World Cup goals
          </h3>
          <CareerGoalsRaceSection
            holder={careerHolder}
            chasers={careerChasers}
            brokenRecord={careerBrokenRecord}
            compact
          />
        </div>
      </div>
    </section>
  );
}
