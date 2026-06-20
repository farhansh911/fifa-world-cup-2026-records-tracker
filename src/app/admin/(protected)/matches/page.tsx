import { getAllMatches, getTeams } from "@/lib/data";
import { AdminMatchesClient } from "@/components/admin/AdminMatches";

export default async function AdminMatchesPage() {
  const [matches, teams] = await Promise.all([getAllMatches(), getTeams()]);
  return <AdminMatchesClient matches={matches} teams={teams} />;
}
