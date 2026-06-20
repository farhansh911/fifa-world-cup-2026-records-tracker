"use client";

import { useRef, useEffect } from "react";
import {
  Trophy,
  Target,
  Calendar,
  TrendingUp,
  Users,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { gsap, registerGsap } from "@/lib/gsap";

const iconMap: Record<string, LucideIcon> = {
  calendar: Calendar,
  target: Target,
  trophy: Trophy,
  trending: TrendingUp,
  users: Users,
  chart: BarChart3,
};

export interface StatItem {
  key: string;
  label: string;
  value: number;
  icon: keyof typeof iconMap;
}

interface StatsGridProps {
  stats: StatItem[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const el = gridRef.current;
    if (!el) return;

    const cards = el.querySelectorAll(".stat-card");
    const numbers = el.querySelectorAll(".stat-num");

    const ctx = gsap.context(() => {
      gsap.from(cards, {
        opacity: 0,
        y: 28,
        duration: 0.55,
        stagger: 0.07,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });

      numbers.forEach((num) => {
        const target = parseInt(num.getAttribute("data-value") || "0", 10);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.4,
          ease: "power1.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            num.textContent = Math.round(obj.val).toLocaleString();
          },
        });
      });
    }, el);

    return () => ctx.revert();
  }, [stats]);

  return (
    <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-white/[0.08] border border-white/[0.08]">
      {stats.map(({ key, label, value, icon }) => {
        const Icon = iconMap[icon] ?? Calendar;
        return (
          <div key={key} className="stat-card bg-[#0c0818] p-5 sm:p-6">
            <Icon className="w-4 h-4 text-white/30 mb-3" strokeWidth={1.5} />
            <p
              className="stat-num font-display text-2xl sm:text-3xl font-bold text-white tabular-nums"
              data-value={value}
            >
              0
            </p>
            <p className="text-xs text-white/40 mt-1.5 uppercase tracking-wider">{label}</p>
          </div>
        );
      })}
    </div>
  );
}
