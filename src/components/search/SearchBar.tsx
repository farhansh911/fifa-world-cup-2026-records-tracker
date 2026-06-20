"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  defaultValue?: string;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBar({ defaultValue = "", autoFocus, className }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const debouncedSearch = useCallback(
    (value: string) => {
      if (value.trim()) {
        router.push(`/search?q=${encodeURIComponent(value.trim())}`);
      }
    },
    [router]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== defaultValue) debouncedSearch(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, debouncedSearch, defaultValue]);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search players, teams, matches, records..."
        autoFocus={autoFocus}
        className="w-full pl-12 pr-12 py-4 rounded-2xl glass text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 text-lg"
      />
      {query && (
        <button
          onClick={() => setQuery("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
