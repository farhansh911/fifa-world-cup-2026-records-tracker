import { cn } from "@/lib/utils";

interface StageBadgeProps {
  stage: string | null | undefined;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  if (!stage) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        "bg-violet-500/15 text-violet-300 border border-violet-500/25",
        className
      )}
    >
      {stage}
    </span>
  );
}
