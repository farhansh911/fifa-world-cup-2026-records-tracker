import Link from "next/link";
import { PlayerPhoto } from "@/components/players/PlayerPhoto";
import type { Player } from "@/types/database";

interface PlayerCardProps {
  player: Player;
}

export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <Link href={`/players/${player.id}`} className="block group">
      <article className="card card-hover p-4 flex items-center gap-4">
        <PlayerPhoto name={player.name} photoUrl={player.photo_url} size={48} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate group-hover:text-accent transition-colors">{player.name}</h3>
          <p className="text-xs text-white/35">{player.team?.name}{player.position && ` · ${player.position}`}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-xl font-bold">{player.goals}</p>
          <p className="text-[10px] text-white/35 uppercase">goals</p>
        </div>
      </article>
    </Link>
  );
}
