import { getPlayers, getTeams } from "@/lib/data";
import { AdminPlayersClient } from "@/components/admin/AdminPlayers";

export default async function AdminPlayersPage() {
  const [players, teams] = await Promise.all([getPlayers(), getTeams()]);
  return <AdminPlayersClient players={players} teams={teams} />;
}
