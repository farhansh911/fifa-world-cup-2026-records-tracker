import Image from "next/image";
import { cn } from "@/lib/utils";

interface TeamFlagProps {
  name: string;
  code: string;
  flag_url: string | null;
  size?: number;
  className?: string;
}

export function TeamFlag({ name, code, flag_url, size = 28, className }: TeamFlagProps) {
  if (flag_url) {
    return (
      <Image
        src={flag_url}
        alt={`${name} flag`}
        width={size}
        height={size}
        className={cn("rounded-full object-cover shrink-0 ring-1 ring-white/10", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-white/5 flex items-center justify-center font-bold text-white/50 shrink-0 ring-1 ring-white/10",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {code}
    </div>
  );
}
