"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, Upload } from "lucide-react";
import type { Team } from "@/types/database";

const inputClass = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-accent/50";

export function AdminTeamsClient({ teams: initial }: { teams: Team[] }) {
  const [teams, setTeams] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const emptyForm = { name: "", code: "", flag_url: "", group_name: "", matches_played: "0", wins: "0", draws: "0", losses: "0", goals_for: "0", goals_against: "0" };
  const [form, setForm] = useState(emptyForm);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const path = `flags/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("images").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      setForm({ ...form, flag_url: data.publicUrl });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const payload = {
      name: form.name, code: form.code.toUpperCase(), flag_url: form.flag_url || null, group_name: form.group_name || null,
      matches_played: parseInt(form.matches_played), wins: parseInt(form.wins), draws: parseInt(form.draws),
      losses: parseInt(form.losses), goals_for: parseInt(form.goals_for), goals_against: parseInt(form.goals_against),
    };

    if (editing) {
      await supabase.from("teams").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("teams").insert(payload);
    }

    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this team?")) return;
    const supabase = createClient();
    await supabase.from("teams").delete().eq("id", id);
    setTeams(teams.filter((t) => t.id !== id));
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">Teams</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-black text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Team
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6 grid sm:grid-cols-2 gap-4">
          <input className={inputClass} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={inputClass} placeholder="Code (e.g. USA)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <input className={inputClass} placeholder="Group" value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} />
          <div className="flex gap-2">
            <input className={inputClass} placeholder="Flag URL" value={form.flag_url} onChange={(e) => setForm({ ...form, flag_url: e.target.value })} />
            <label className="flex items-center gap-1 px-3 py-2 rounded-lg glass cursor-pointer text-sm">
              <Upload className="w-4 h-4" /> {uploading ? "..." : "Upload"}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
          {["matches_played", "wins", "draws", "losses", "goals_for", "goals_against"].map((field) => (
            <input key={field} className={inputClass} type="number" placeholder={field.replace("_", " ")} value={form[field as keyof typeof form]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
          ))}
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" className="px-6 py-2 rounded-lg bg-accent font-medium">{editing ? "Update" : "Create"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg glass">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {teams.map((t) => (
          <div key={t.id} className="glass rounded-xl p-4 flex items-center justify-between">
            <div><p className="font-semibold">{t.name} ({t.code})</p><p className="text-sm text-white/50">Group {t.group_name} · {t.wins}W {t.draws}D {t.losses}L</p></div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(t); setForm({ name: t.name, code: t.code, flag_url: t.flag_url || "", group_name: t.group_name || "", matches_played: String(t.matches_played), wins: String(t.wins), draws: String(t.draws), losses: String(t.losses), goals_for: String(t.goals_for), goals_against: String(t.goals_against) }); setShowForm(true); }} className="p-2 rounded-lg hover:bg-white/10"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
