import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "broken" | "new" | "live" | "default";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    broken: "bg-secondary/20 text-secondary border-secondary/40",
    new: "bg-accent/20 text-accent border-accent/40",
    live: "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse-glow",
    default: "bg-white/10 text-white/70 border-white/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
