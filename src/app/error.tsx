"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-2xl font-bold mb-2">Something went wrong</p>
      <p className="text-white/45 text-sm mb-6 max-w-md">
        Try refreshing the page. If the error persists, restart the dev server with a clean build:
        {" "}
        <code className="text-accent text-xs">rm -rf .next && npm run dev</code>
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-white text-[#0a0612] text-sm font-semibold hover:bg-white/90"
      >
        Try again
      </button>
    </div>
  );
}
