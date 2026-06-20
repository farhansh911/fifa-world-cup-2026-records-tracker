"use client";

import { Share2 } from "lucide-react";

interface ShareRecordButtonProps {
  title: string;
  text: string;
}

export function ShareRecordButton({ title, text }: ShareRecordButtonProps) {
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title, text, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="p-2 rounded-lg text-white/40 hover:text-accent hover:bg-white/5 transition-colors"
      aria-label="Share record"
    >
      <Share2 className="w-4 h-4" />
    </button>
  );
}
