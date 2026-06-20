import { notFound } from "next/navigation";
import Link from "next/link";
import { createMetadata } from "@/lib/seo";
import { PlayerPhoto } from "@/components/players/PlayerPhoto";
import { getPlayer, getPlayerRecords, REVALIDATE_SECONDS } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) return createMetadata({ title: "Player Not Found" });

  return createMetadata({
    title: player.name,
    description: `${player.name} — ${player.team?.name || "World Cup 2026"} player profile and stats.`,
    path: `/players/${id}`,
  });
}

export default async function PlayerDetailPage({ params }: Props) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  const records = await getPlayerRecords(player.name);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/players" className="text-accent text-sm hover:underline mb-6 inline-block">
        ← Back to Players
      </Link>

      <div className="glass rounded-2xl p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <PlayerPhoto
            name={player.name}
            photoUrl={player.photo_url}
            size={128}
            rounded="2xl"
            priority
          />

          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-black">{player.name}</h1>
            {player.team && (
              <Link href={`/teams/${player.team.id}`} className="text-accent hover:underline">
                {player.team.name}
              </Link>
            )}
            {player.position && <p className="text-white/50 mt-1">{player.position}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          {[
            { label: "Goals", value: player.goals },
            { label: "Assists", value: player.assists },
            { label: "Minutes", value: player.minutes_played },
            { label: "Clean Sheets", value: player.clean_sheets },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-highlight">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {(records.broken.length > 0 || records.created.length > 0) && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Records</h2>
          <div className="space-y-3">
            {records.broken.map((r) => (
              <div key={r.id} className="glass rounded-xl p-4">
                <span className="text-secondary text-xs font-bold uppercase">Broken</span>
                <p className="font-semibold">{r.title}</p>
                <p className="text-sm text-white/50">{formatDate(r.event_date)}</p>
              </div>
            ))}
            {records.created.map((r) => (
              <div key={r.id} className="glass rounded-xl p-4">
                <span className="text-accent text-xs font-bold uppercase">New</span>
                <p className="font-semibold">{r.title}</p>
                <p className="text-sm text-white/50">{formatDate(r.event_date)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
