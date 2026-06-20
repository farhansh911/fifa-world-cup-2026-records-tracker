import { getTeams } from "@/lib/data";
import { AdminTeamsClient } from "@/components/admin/AdminTeams";

export default async function AdminTeamsPage() {
  const teams = await getTeams();
  return <AdminTeamsClient teams={teams} />;
}
