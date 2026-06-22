"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Search, Radio } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/records/broken", label: "Records Broken" },
  { href: "/records/new", label: "New Records" },
  { href: "/matches", label: "Matches" },
  { href: "/bracket", label: "Bracket" },
  { href: "/golden-boot", label: "Golden Boot" },
  { href: "/timeline", label: "Timeline" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/stats", label: "Stats" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0a0612]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="font-display font-black text-lg tracking-tight hover:text-accent transition-colors shrink-0"
          >
            WC<span className="text-accent">26</span> Records
          </Link>

          {/* Center nav — desktop */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-2.5 py-2 text-sm whitespace-nowrap transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "text-white font-medium"
                    : "text-white/45 hover:text-white/80"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-400 border border-red-500/25 bg-red-500/5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
              </span>
              Live
            </span>

            <Link
              href="/search"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-white/45 border border-white/10 hover:border-white/20 hover:text-white/70 transition-colors"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Search</span>
            </Link>

            <Link
              href="/matches"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white text-[#0a0612] hover:bg-white/90 transition-colors"
            >
              <Radio className="w-3.5 h-3.5" />
              Matches
            </Link>

            <Link
              href="/search"
              className="sm:hidden p-2 text-white/45 hover:text-white transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </Link>

            <ThemeToggle />

            <button
              className="lg:hidden p-2 text-white/45 hover:text-white transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="lg:hidden pb-4 border-t border-white/[0.06] pt-2">
            <div className="flex items-center gap-2 px-2 py-3 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-400 border border-red-500/25 bg-red-500/5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Tournament live
              </span>
              <Link
                href="/matches"
                onClick={() => setOpen(false)}
                className="px-3 py-1 text-xs font-medium bg-white text-[#0a0612]"
              >
                Matches
              </Link>
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-2 py-2.5 text-sm",
                  pathname === link.href ? "text-white font-medium" : "text-white/50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
