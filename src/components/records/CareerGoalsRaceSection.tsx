import Link from "next/link";
import { Trophy } from "lucide-react";
import { RecordBrokenCard } from "@/components/records/RecordBrokenCard";
import { RecordChaseCard } from "@/components/records/RecordChaseCard";
import { Reveal } from "@/components/animations/Reveal";
import type { RecordBroken } from "@/types/database";
import type { RecordChase } from "@/lib/records-engine";

interface CareerGoalsRaceSectionProps {
  holder: RecordChase | null;
  chasers: RecordChase[];
  brokenRecord: RecordBroken | null;
  compact?: boolean;
}

export function CareerGoalsRaceSection({
  holder,
  chasers,
  brokenRecord,
  compact = false,
}: CareerGoalsRaceSectionProps) {
  if (!holder && !brokenRecord && chasers.length === 0) return null;

  const displayRecord = brokenRecord;
  const topChasers = compact ? chasers.slice(0, 2) : chasers;

  return (
    <section>
      {!compact && (
        <div className="mb-6">
          <div className="flex items-center gap-2 text-accent mb-1">
            <Trophy className="w-4 h-4" strokeWidth={2} />
            <span className="text-[10px] font-semibold uppercase tracking-widest">All-time record</span>
          </div>
          <h2 className="font-display text-xl font-bold">Most World Cup goals ever</h2>
          <p className="text-sm text-white/45 mt-1">
            {holder
              ? `${holder.player} holds the mark${chasers[0] ? ` — ${chasers[0].player} is ${chasers[0].goalsAway} behind` : ""}.`
              : "Live all-time career goals tracker."}
          </p>
        </div>
      )}

      <Reveal className={compact ? "space-y-4" : "grid md:grid-cols-2 lg:grid-cols-3 gap-4"}>
        {displayRecord && (
          <div className={compact ? undefined : "md:col-span-2 lg:col-span-1"}>
            <RecordBrokenCard record={displayRecord} />
          </div>
        )}
        {topChasers.map((chase) => (
          <RecordChaseCard key={chase.id} chase={chase} />
        ))}
      </Reveal>

      {compact && (
        <Link
          href="/records/broken"
          className="inline-block mt-4 text-sm text-white/45 hover:text-accent transition-colors"
        >
          Full records tracker →
        </Link>
      )}
    </section>
  );
}
