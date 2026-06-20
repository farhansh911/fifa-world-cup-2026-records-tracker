import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/data";

export default async function AdminIndexPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user && (await isAdmin(user.id))) {
    redirect("/admin/dashboard");
  }

  redirect("/admin/login");
}
