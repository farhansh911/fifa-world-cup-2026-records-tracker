"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { TimelineEvent, TimelineEventType } from "@/types/database";

const inputClass = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-accent/50";

export function AdminTimelineClient({ events: initial }: { events: TimelineEvent[] }) {
  const [events, setEvents] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const emptyForm = { event_type: "milestone" as TimelineEventType, title: "", description: "", event_date: new Date().toISOString().slice(0, 16) };
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    await supabase.from("timeline_events").insert({
      ...form,
      event_date: new Date(form.event_date).toISOString(),
    });
    setShowForm(false);
    setForm(emptyForm);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const supabase = createClient();
    await supabase.from("timeline_events").delete().eq("id", id);
    setEvents(events.filter((e) => e.id !== id));
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">Timeline Events</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-highlight text-black text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6 grid sm:grid-cols-2 gap-4">
          <select className={inputClass} value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value as TimelineEventType })}>
            <option value="goal">Goal</option>
            <option value="record_broken">Record Broken</option>
            <option value="record_created">Record Created</option>
            <option value="match_highlight">Match Highlight</option>
            <option value="milestone">Milestone</option>
          </select>
          <input className={inputClass} type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required />
          <input className={`${inputClass} sm:col-span-2`} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea className={`${inputClass} sm:col-span-2`} placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" className="px-6 py-2 rounded-lg bg-accent font-medium">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg glass">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className="glass rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-accent uppercase">{e.event_type.replace("_", " ")}</span>
              <p className="font-semibold">{e.title}</p>
            </div>
            <button onClick={() => handleDelete(e.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
