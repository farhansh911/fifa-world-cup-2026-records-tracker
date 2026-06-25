import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

/** Match / record milestone dates — use UTC so kickoff day matches the tournament calendar. */
export function formatRecordDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getImportanceColor(level: string): string {
  switch (level) {
    case "legendary":
      return "bg-highlight/20 text-highlight border-highlight/40";
    case "high":
      return "bg-secondary/20 text-secondary border-secondary/40";
    case "medium":
      return "bg-accent/20 text-accent border-accent/40";
    default:
      return "bg-white/10 text-white/70 border-white/20";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "live":
      return "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse-glow";
    case "completed":
      return "bg-green-500/20 text-green-400 border-green-500/40";
    case "postponed":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
    default:
      return "bg-accent/20 text-accent border-accent/40";
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("wc2026_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("wc2026_session", id);
  }
  return id;
}
