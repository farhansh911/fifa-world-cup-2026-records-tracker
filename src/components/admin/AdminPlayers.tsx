"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, Upload } from "lucide-react";
import type { Player, Team } from "@/types/database";

const inputClass = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-accent/50";

export function AdminPlayersClient({ players: initial, teams }: { players: Player[]; teams: Team[] }) {
  const [players, setPlayers] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const emptyForm = { name: "", team_id: "", position: "", photo_url: "", goals: "0", assists: "0", minutes_played: "0", clean_sheets: "0" };
  const [form, setForm] = useState(emptyForm);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const path = `players/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("images").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      setForm({ ...form, photo_url: data.publicUrl });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const payload = {
      name: form.name, team_id: form.team_id || null, position: form.position || null,
      photo_url: form.photo_url || null, goals: parseInt(form.goals), assists: parseInt(form.assists),
      minutes_played: parseInt(form.minutes_played), clean_sheets: parseInt(form.clean_sheets),
    };

    if (editing) {
      await supabase.from("players").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("players").insert(payload);
    }

    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this player?")) return;
    const supabase = createClient();
    await supabase.from("players").delete().eq("id", id);
    setPlayers(players.filter((p) => p.id !== id));
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">Players</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-black text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Player
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6 grid sm:grid-cols-2 gap-4">
          <input className={inputClass} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select className={inputClass} value={form.team_id} onChange={(e) => setForm({ ...form, team_id: e.target.value })}>
            <option value="">Team</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input className={inputClass} placeholder="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <div className="flex gap-2">
            <input className={inputClass} placeholder="Photo URL" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} />
            <label className="flex items-center gap-1 px-3 py-2 rounded-lg glass cursor-pointer text-sm">
              <Upload className="w-4 h-4" /> {uploading ? "..." : "Upload"}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
          {["goals", "assists", "minutes_played", "clean_sheets"].map((field) => (
            <input key={field} className={inputClass} type="number" placeholder={field.replace("_", " ")} value={form[field as keyof typeof form]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
          ))}
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" className="px-6 py-2 rounded-lg bg-accent font-medium">{editing ? "Update" : "Create"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg glass">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {players.map((p) => (
          <div key={p.id} className="glass rounded-xl p-4 flex items-center justify-between">
            <div><p className="font-semibold">{p.name}</p><p className="text-sm text-white/50">{p.team?.name} · {p.goals}G {p.assists}A</p></div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(p); setForm({ name: p.name, team_id: p.team_id || "", position: p.position || "", photo_url: p.photo_url || "", goals: String(p.goals), assists: String(p.assists), minutes_played: String(p.minutes_played), clean_sheets: String(p.clean_sheets) }); setShowForm(true); }} className="p-2 rounded-lg hover:bg-white/10"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
