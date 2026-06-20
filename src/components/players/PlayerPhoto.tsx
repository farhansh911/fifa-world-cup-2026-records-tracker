"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { fifaPhotoDisplayUrl } from "@/lib/fifa-player-photos";
import { cn } from "@/lib/utils";

interface PlayerPhotoProps {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
  rounded?: "full" | "xl" | "2xl";
  priority?: boolean;
  /** Crop to face/head only (default) vs full portrait */
  crop?: "face" | "full";
}

export function PlayerPhoto({
  name,
  photoUrl,
  size = 48,
  className,
  rounded = "full",
  priority = false,
  crop = "face",
}: PlayerPhotoProps) {
  const [error, setError] = useState(false);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const radius =
    rounded === "2xl" ? "rounded-2xl" : rounded === "xl" ? "rounded-xl" : "rounded-full";

  const src = useMemo(() => {
    if (!photoUrl) return null;
    if (photoUrl.includes("digitalhub.fifa.com")) {
      return fifaPhotoDisplayUrl(photoUrl, size, crop);
    }
    return photoUrl;
  }, [photoUrl, size, crop]);

  if (!src || error) {
    return (
      <div
        className={cn(
          radius,
          "bg-gradient-to-br from-primary/90 to-secondary/70 flex items-center justify-center font-bold text-white shrink-0 ring-1 ring-white/10",
          className
        )}
        style={{ width: size, height: size, fontSize: Math.max(11, size * 0.3) }}
        aria-hidden={!photoUrl}
      >
        {initials || "?"}
      </div>
    );
  }

  // Minimal CSS zoom — FIFA CDN already delivers a head-focused crop
  const faceScale = crop === "face" ? 1.08 : 1;

  return (
    <div
      className={cn(
        radius,
        "relative overflow-hidden shrink-0 ring-1 ring-white/10 bg-white/5",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={name}
        fill
        sizes={`${Math.ceil(size * 2)}px`}
        quality={90}
        priority={priority}
        unoptimized={src.includes("digitalhub.fifa.com")}
        onError={() => setError(true)}
        className="object-cover"
        style={
          crop === "face"
            ? {
                objectPosition: "50% 8%",
                transform: faceScale === 1 ? undefined : `scale(${faceScale})`,
                transformOrigin: "50% 15%",
              }
            : { objectPosition: "50% 0%" }
        }
      />
    </div>
  );
}
