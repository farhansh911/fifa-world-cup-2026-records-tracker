import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createMetadata } from "@/lib/seo";
import { FavoriteTeamButton } from "@/components/teams/FavoriteTeamButton";
import { getTeam, getTeamRecords, getPlayers, REVALIDATE_SECONDS } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const team = await getTeam(id);
  if (!team) return createMetadata({ title: "Team Not Found" });

  return createMetadata({
    title: team.name,
    description: `${team.name} at FIFA World Cup 2026 — stats, matches, and records.`,
    path: `/teams/${id}`,
  });
}

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params;
  const team = await getTeam(id);
  if (!team) notFound();

  const [records, allPlayers] = await Promise.all([
    getTeamRecords(team.name),
    getPlayers(),
  ]);
  const squad = allPlayers.filter((p) => p.team_id === team.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/teams" className="text-accent text-sm hover:underline mb-6 inline-block">
        ← Back to Teams
      </Link>

      <div className="glass rounded-2xl p-8 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            {team.flag_url ? (
              <Image src={team.flag_url} alt={team.name} width={96} height={96} className="rounded-full" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-black">
                {team.code}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black">{team.name}</h1>
              {team.group_name && <p className="text-accent">Group {team.group_name}</p>}
            </div>
          </div>
          <FavoriteTeamButton teamId={team.id} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          {[
            { label: "Played", value: team.matches_played },
            { label: "Wins", value: team.wins },
            { label: "Draws", value: team.draws },
            { label: "Losses", value: team.losses },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-highlight">{s.value}</div>
              <div className="text-xs text-white/40">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-accent">{team.goals_for}</div>
            <div className="text-xs text-white/40">Goals For</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-secondary">{team.goals_against}</div>
            <div className="text-xs text-white/40">Goals Against</div>
          </div>
        </div>
      </div>

      {squad.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Squad</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {squad.map((p) => (
              <Link key={p.id} href={`/players/${p.id}`} className="glass glass-hover rounded-xl p-4 flex justify-between">
                <span>{p.name}</span>
                <span className="text-white/40 text-sm">{p.position} · {p.goals}G</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(records.broken.length > 0 || records.created.length > 0) && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Records</h2>
          <div className="space-y-3">
            {[...records.broken, ...records.created].map((r) => (
              <div key={r.id} className="glass rounded-xl p-4">
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
