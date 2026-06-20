"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    const supabase = createClient();
    const { error } = await supabase.from("newsletter_signups").insert({ email });

    setStatus(error ? "error" : "success");
    if (!error) setEmail("");
  };

  return (
    <div className="card p-8 sm:p-10">
      <h3 className="font-display text-xl font-bold mb-2">Get record alerts</h3>
      <p className="text-white/45 text-sm mb-6 max-w-md">
        Email updates when a record is broken during the tournament.
      </p>

      {status === "success" ? (
        <p className="text-accent text-sm font-medium">Subscribed. You&apos;ll hear from us when records fall.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="flex-1 px-4 py-3 bg-[#0a0612] border border-white/10 text-sm focus:outline-none focus:border-white/25"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-6 py-3 bg-white text-[#0a0612] text-sm font-semibold hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subscribe"}
          </button>
        </form>
      )}
      {status === "error" && <p className="text-red-400 text-sm mt-2">Something went wrong. Try again.</p>}
    </div>
  );
}
