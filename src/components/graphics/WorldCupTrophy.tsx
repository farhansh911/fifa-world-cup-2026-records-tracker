"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Local bundled artwork — reliable fallback when remote photo fails. */
const LOCAL_TROPHY_SVG = "/fifa-world-cup-trophy.svg";

/**
 * Wikimedia Commons photograph of the real trophy.
 * @see https://commons.wikimedia.org/wiki/File:FIFA_World_Cup_Trophy_cropped.jpg
 */
const REMOTE_TROPHY_PHOTO =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/FIFA_World_Cup_Trophy_cropped.jpg/440px-FIFA_World_Cup_Trophy_cropped.jpg";

const PHOTO_SOURCES = [REMOTE_TROPHY_PHOTO, LOCAL_TROPHY_SVG] as const;

interface WorldCupTrophyProps {
  className?: string;
  size?: number;
  /** Use the real trophy photograph (knockout bracket centre). */
  photo?: boolean;
}

export function WorldCupTrophy({ className = "", size = 120, photo = false }: WorldCupTrophyProps) {
  const [sourceIndex, setSourceIndex] = useState(0);

  const src = photo ? PHOTO_SOURCES[Math.min(sourceIndex, PHOTO_SOURCES.length - 1)] : LOCAL_TROPHY_SVG;
  const height = Math.round(size * 1.8);

  const advanceSource = () => {
    if (!photo) return;
    setSourceIndex((i) => Math.min(i + 1, PHOTO_SOURCES.length - 1));
  };

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
      onError={advanceSource}
    />
  );
}
