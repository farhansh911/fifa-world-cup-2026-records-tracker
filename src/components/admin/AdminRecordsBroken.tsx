"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import type { RecordBroken, ImportanceLevel } from "@/types/database";

interface AdminRecordsBrokenProps {
  records: RecordBroken[];
}

const inputClass = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-accent/50";

export function AdminRecordsBrokenClient({ records: initial }: AdminRecordsBrokenProps) {
  const [records, setRecords] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecordBroken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const emptyForm = {
    title: "", previous_holder: "", new_holder: "", old_value: "", new_value: "",
    importance: "medium" as ImportanceLevel, explanation: "", event_date: new Date().toISOString().slice(0, 16),
  };
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const payload = { ...form, event_date: new Date(form.event_date).toISOString() };

    if (editing) {
      await supabase.from("records_broken").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("records_broken").insert(payload);
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
    await supabase.from("records_broken").delete().eq("id", id);
    setRecords(records.filter((r) => r.id !== id));
    router.refresh();
  };

  const startEdit = (record: RecordBroken) => {
    setEditing(record);
    setForm({
      title: record.title,
      previous_holder: record.previous_holder,
      new_holder: record.new_holder,
      old_value: record.old_value,
      new_value: record.new_value,
      importance: record.importance,
      explanation: record.explanation || "",
      event_date: record.event_date.slice(0, 16),
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">Records Broken</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6 grid sm:grid-cols-2 gap-4">
          <input className={inputClass} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <select className={inputClass} value={form.importance} onChange={(e) => setForm({ ...form, importance: e.target.value as ImportanceLevel })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="legendary">Legendary</option>
          </select>
          <input className={inputClass} placeholder="Previous Holder" value={form.previous_holder} onChange={(e) => setForm({ ...form, previous_holder: e.target.value })} required />
          <input className={inputClass} placeholder="New Holder" value={form.new_holder} onChange={(e) => setForm({ ...form, new_holder: e.target.value })} required />
          <input className={inputClass} placeholder="Old Value" value={form.old_value} onChange={(e) => setForm({ ...form, old_value: e.target.value })} required />
          <input className={inputClass} placeholder="New Value" value={form.new_value} onChange={(e) => setForm({ ...form, new_value: e.target.value })} required />
          <input className={inputClass} type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required />
          <textarea className={`${inputClass} sm:col-span-2`} placeholder="Explanation" rows={3} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" disabled={loading} className="px-6 py-2 rounded-lg bg-accent font-medium disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Update" : "Create"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg glass">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {records.map((r) => (
          <div key={r.id} className="glass rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-white/50">{r.new_holder} — {r.new_value}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(r)} className="p-2 rounded-lg hover:bg-white/10"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
