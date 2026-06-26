import Image from "next/image";
import { cn } from "@/lib/utils";

/** Wikimedia Commons — photograph of the FIFA World Cup Trophy (cropped). */
const FIFA_TROPHY_PHOTO =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/FIFA_World_Cup_Trophy%2C_cropped.jpg/440px-FIFA_World_Cup_Trophy%2C_cropped.jpg";

interface WorldCupTrophyProps {
  className?: string;
  size?: number;
  /** Use the real trophy photograph (knockout bracket centre). */
  photo?: boolean;
}

export function WorldCupTrophy({ className = "", size = 120, photo = false }: WorldCupTrophyProps) {
  if (photo) {
    const height = Math.round(size * 1.45);
    return (
      <Image
        src={FIFA_TROPHY_PHOTO}
        alt="FIFA World Cup Trophy"
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

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="trophyGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5C542" />
          <stop offset="50%" stopColor="#FFE082" />
          <stop offset="100%" stopColor="#C9A020" />
        </linearGradient>
        <linearGradient id="trophyShine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="100" rx="35" ry="8" fill="rgba(245,197,66,0.2)" />
      <rect x="42" y="95" width="36" height="8" rx="2" fill="url(#trophyGold)" />
      <rect x="48" y="88" width="24" height="8" rx="1" fill="url(#trophyGold)" />
      <path d="M54 88 L54 55 Q54 45 60 42 Q66 45 66 55 L66 88" fill="url(#trophyGold)" />
      <path
        d="M35 55 Q35 20 60 15 Q85 20 85 55 Q85 65 60 68 Q35 65 35 55"
        fill="url(#trophyGold)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />
      <path d="M35 45 Q20 45 20 30 Q20 20 35 25" stroke="url(#trophyGold)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M85 45 Q100 45 100 30 Q100 20 85 25" stroke="url(#trophyGold)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M48 25 Q52 35 50 50" stroke="url(#trophyShine)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <polygon
        points="60,28 62,34 68,34 63,38 65,44 60,40 55,44 57,38 52,34 58,34"
        fill="rgba(255,255,255,0.5)"
      />
    </svg>
  );
}
