import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, refreshTournamentStats } from "@/lib/data";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await refreshTournamentStats();
  return NextResponse.json({ success: true });
}
