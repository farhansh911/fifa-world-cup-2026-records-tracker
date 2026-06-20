"use client";

import Link from "next/link";
import Image from "next/image";
import { FavoriteTeamButton } from "@/components/teams/FavoriteTeamButton";
import type { Team } from "@/types/database";

interface TeamCardProps {
  team: Team;
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <article className="card card-hover p-5 relative group">
      <div className="absolute top-4 right-4">
        <FavoriteTeamButton teamId={team.id} />
      </div>
      <Link href={`/teams/${team.id}`} className="block">
        <div className="flex flex-col items-center text-center pt-2">
          {team.flag_url ? (
            <Image src={team.flag_url} alt={team.name} width={56} height={56} className="rounded-full object-cover mb-3" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center font-bold text-lg mb-3">
              {team.code}
            </div>
          )}
          <h3 className="font-display font-bold group-hover:text-accent transition-colors">{team.name}</h3>
          {team.group_name && <p className="text-xs text-white/35 mt-1">Group {team.group_name}</p>}
          <div className="flex gap-4 mt-4 text-sm tabular-nums">
            <span><span className="text-white/35">W </span>{team.wins}</span>
            <span><span className="text-white/35">D </span>{team.draws}</span>
            <span><span className="text-white/35">L </span>{team.losses}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
