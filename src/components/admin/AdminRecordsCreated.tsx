"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import type { RecordCreated } from "@/types/database";

const inputClass = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-accent/50";

export function AdminRecordsCreatedClient({ records: initial }: { records: RecordCreated[] }) {
  const [records, setRecords] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecordCreated | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const emptyForm = { title: "", holder: "", value: "", description: "", event_date: new Date().toISOString().slice(0, 16) };
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const payload = { ...form, event_date: new Date(form.event_date).toISOString() };

    if (editing) {
      await supabase.from("records_created").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("records_created").insert(payload);
    }

    setLoading(false);
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    const supabase = createClient();
    await supabase.from("records_created").delete().eq("id", id);
    setRecords(records.filter((r) => r.id !== id));
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">New Records</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-black text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6 grid sm:grid-cols-2 gap-4">
          <input className={inputClass} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className={inputClass} placeholder="Holder" value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })} required />
          <input className={inputClass} placeholder="Value" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
          <input className={inputClass} type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required />
          <textarea className={`${inputClass} sm:col-span-2`} placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" disabled={loading} className="px-6 py-2 rounded-lg bg-accent font-medium">{editing ? "Update" : "Create"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg glass">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {records.map((r) => (
          <div key={r.id} className="glass rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-white/50">{r.holder} — {r.value}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(r); setForm({ title: r.title, holder: r.holder, value: r.value, description: r.description || "", event_date: r.event_date.slice(0, 16) }); setShowForm(true); }} className="p-2 rounded-lg hover:bg-white/10"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
