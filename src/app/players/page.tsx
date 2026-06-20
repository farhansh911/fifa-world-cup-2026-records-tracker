import { createMetadata } from "@/lib/seo";
import { PageBanner } from "@/components/layout/PageBanner";
import { PlayerCard } from "@/components/players/PlayerCard";
import { Reveal } from "@/components/animations/Reveal";
import { getPlayers } from "@/lib/data";

export const revalidate = 60;

export const metadata = createMetadata({
  title: "World Cup 2026 Players",
  description: "Player profiles and stats from FIFA World Cup 2026.",
  path: "/players",
});

export default async function PlayersPage() {
  const players = await getPlayers();

  return (
    <>
      <PageBanner badge="Players" title="Player profiles" subtitle="Stats and records for every player." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {players.length > 0 ? (
          <Reveal className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {players.map((p) => <PlayerCard key={p.id} player={p} />)}
          </Reveal>
        ) : (
          <p className="card p-12 text-center text-white/35 text-sm">No players added yet.</p>
        )}
      </div>
    </>
  );
}
