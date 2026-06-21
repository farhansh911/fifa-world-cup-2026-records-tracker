import { cn } from "@/lib/utils";

interface GroupBadgeProps {
  group: string | null | undefined;
  className?: string;
}

export function GroupBadge({ group, className }: GroupBadgeProps) {
  if (!group) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        "bg-accent/15 text-accent border border-accent/25",
        className
      )}
    >
      Group {group}
    </span>
  );
}
