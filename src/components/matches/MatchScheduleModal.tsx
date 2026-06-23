"use client";

import { useEffect, useRef } from "react";
import { X, Calendar } from "lucide-react";
import { MatchScheduleList } from "@/components/matches/MatchScheduleList";
import { gsap, registerGsap } from "@/lib/gsap";
import type { ScheduleMatch } from "@/lib/matches";

interface MatchScheduleModalProps {
  open: boolean;
  onClose: () => void;
  matches: ScheduleMatch[];
  title?: string;
}

export function MatchScheduleModal({ open, onClose, matches, title = "Match schedule" }: MatchScheduleModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    registerGsap();
    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(panelRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
    });

    document.body.style.overflow = "hidden";
    return () => {
      ctx.revert();
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        className="relative w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] bg-[#0c0818] border border-white/10 sm:rounded-lg flex flex-col shadow-2xl"
        role="dialog"
        aria-modal
        aria-labelledby="schedule-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            <h2 id="schedule-title" className="font-display font-bold text-lg">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/45 hover:text-white transition-colors"
            aria-label="Close schedule"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5">
          <MatchScheduleList matches={matches} compact showNextUp={false} showVenue={false} />
        </div>

        <div className="px-5 py-3 border-t border-white/[0.08] shrink-0">
          <p className="text-xs text-white/30 text-center">{matches.length} upcoming fixture{matches.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
    </div>
  );
}
