"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const LOCAL_TROPHY_PHOTO = "/fifa-world-cup-trophy.png";
const LOCAL_TROPHY_SVG = "/fifa-world-cup-trophy.svg";

interface WorldCupTrophyProps {
  className?: string;
  size?: number;
  /** Use the real trophy photograph (knockout bracket centre). */
  photo?: boolean;
}

export function WorldCupTrophy({ className = "", size = 120, photo = false }: WorldCupTrophyProps) {
  const src = photo ? LOCAL_TROPHY_PHOTO : LOCAL_TROPHY_SVG;
  const height = photo ? size : Math.round(size * 1.8);

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={height}
      className={cn(
        "object-contain object-bottom drop-shadow-[0_8px_28px_rgba(245,197,66,0.5)]",
        className
      )}
      unoptimized
      priority
    />
  );
}
