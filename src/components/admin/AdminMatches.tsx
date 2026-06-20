"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil } from "lucide-react";
import type { Match, Team, MatchStatus } from "@/types/database";

const inputClass = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-accent/50";

export function AdminMatchesClient({ matches: initial, teams }: { matches: Match[]; teams: Team[] }) {
  const [matches] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const router = useRouter();

  const emptyForm = {
    home_team_id: "", away_team_id: "", home_score: "", away_score: "",
    status: "scheduled" as MatchStatus, minute: "", stadium: "", venue: "",
    match_date: new Date().toISOString().slice(0, 16), attendance: "", goalscorers: "", summary: "",
  };
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const payload = {
      home_team_id: form.home_team_id,
      away_team_id: form.away_team_id,
      home_score: form.home_score ? parseInt(form.home_score) : null,
      away_score: form.away_score ? parseInt(form.away_score) : null,
      status: form.status,
      minute: form.minute ? parseInt(form.minute) : null,
      stadium: form.stadium || null,
      venue: form.venue || null,
      match_date: new Date(form.match_date).toISOString(),
      attendance: form.attendance ? parseInt(form.attendance) : null,
      goalscorers: form.goalscorers || null,
      summary: form.summary || null,
    };

    if (editing) {
      await supabase.from("matches").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("matches").insert(payload);
    }

    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this match?")) return;
    const supabase = createClient();
    await supabase.from("matches").delete().eq("id", id);
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">Matches</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-black text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Match
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6 grid sm:grid-cols-2 gap-4">
          <select className={inputClass} value={form.home_team_id} onChange={(e) => setForm({ ...form, home_team_id: e.target.value })} required>
            <option value="">Home Team</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className={inputClass} value={form.away_team_id} onChange={(e) => setForm({ ...form, away_team_id: e.target.value })} required>
            <option value="">Away Team</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input className={inputClass} type="number" placeholder="Home Score" value={form.home_score} onChange={(e) => setForm({ ...form, home_score: e.target.value })} />
          <input className={inputClass} type="number" placeholder="Away Score" value={form.away_score} onChange={(e) => setForm({ ...form, away_score: e.target.value })} />
          <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as MatchStatus })}>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="postponed">Postponed</option>
          </select>
          <input className={inputClass} type="number" placeholder="Minute (live)" value={form.minute} onChange={(e) => setForm({ ...form, minute: e.target.value })} />
          <input className={inputClass} placeholder="Stadium" value={form.stadium} onChange={(e) => setForm({ ...form, stadium: e.target.value })} />
          <input className={inputClass} placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          <input className={inputClass} type="datetime-local" value={form.match_date} onChange={(e) => setForm({ ...form, match_date: e.target.value })} required />
          <input className={inputClass} type="number" placeholder="Attendance" value={form.attendance} onChange={(e) => setForm({ ...form, attendance: e.target.value })} />
          <input className={inputClass} placeholder="Goalscorers" value={form.goalscorers} onChange={(e) => setForm({ ...form, goalscorers: e.target.value })} />
          <textarea className={`${inputClass} sm:col-span-2`} placeholder="Summary" rows={2} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" className="px-6 py-2 rounded-lg bg-accent font-medium">{editing ? "Update" : "Create"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg glass">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {matches.map((m) => (
          <div key={m.id} className="glass rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{m.home_team?.name} vs {m.away_team?.name}</p>
              <p className="text-sm text-white/50">{m.status} {m.home_score !== null ? `· ${m.home_score}-${m.away_score}` : ""}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(m); setForm({ home_team_id: m.home_team_id, away_team_id: m.away_team_id, home_score: String(m.home_score ?? ""), away_score: String(m.away_score ?? ""), status: m.status, minute: String(m.minute ?? ""), stadium: m.stadium || "", venue: m.venue || "", match_date: m.match_date.slice(0, 16), attendance: String(m.attendance ?? ""), goalscorers: m.goalscorers || "", summary: m.summary || "" }); setShowForm(true); }} className="p-2 rounded-lg hover:bg-white/10"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
