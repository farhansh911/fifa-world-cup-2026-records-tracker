"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Trophy,
  Sparkles,
  Calendar,
  Users,
  Shield,
  Clock,
  LogOut,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/records/broken", label: "Records Broken", icon: Trophy },
  { href: "/admin/records/new", label: "New Records", icon: Sparkles },
  { href: "/admin/matches", label: "Matches", icon: Calendar },
  { href: "/admin/teams", label: "Teams", icon: Shield },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/timeline", label: "Timeline", icon: Clock },
  { href: "/admin/stats", label: "Refresh Stats", icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="w-64 glass border-r border-white/10 min-h-screen p-4 flex flex-col">
      <div className="mb-8 px-2">
        <h2 className="font-bold text-lg">Admin Panel</h2>
        <p className="text-xs text-white/40">WC 2026 Records</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-accent/10 text-accent"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 mt-4"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </aside>
  );
}
