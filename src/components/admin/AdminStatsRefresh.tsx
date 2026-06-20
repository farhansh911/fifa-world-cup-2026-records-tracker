"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function AdminStatsRefresh() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleRefresh = async () => {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/refresh-stats", { method: "POST" });
    if (res.ok) {
      setMessage("Tournament stats refreshed successfully!");
      router.refresh();
    } else {
      setMessage("Failed to refresh stats.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-black mb-6">Refresh Tournament Stats</h1>
      <div className="glass rounded-2xl p-8 max-w-lg">
        <p className="text-white/60 mb-6">
          Recalculate matches played, goals scored, records count, teams, and attendance from the database.
        </p>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-secondary to-accent font-bold disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh Stats"}
        </button>
        {message && <p className="mt-4 text-accent">{message}</p>}
      </div>
    </div>
  );
}
