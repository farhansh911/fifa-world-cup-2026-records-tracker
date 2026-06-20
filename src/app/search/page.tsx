import Link from "next/link";
import { createMetadata } from "@/lib/seo";
import { SearchBar } from "@/components/search/SearchBar";
import { searchAll, REVALIDATE_SECONDS } from "@/lib/data";
import { Users, Shield, Calendar, Trophy } from "lucide-react";

export const revalidate = 60;

export const metadata = createMetadata({
  title: "Search World Cup 2026",
  description: "Search players, teams, matches, and records from FIFA World Cup 2026.",
  path: "/search",
});

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const results = query ? await searchAll(query) : null;

  const sections = results
    ? [
        { key: "players", label: "Players", icon: Users, items: results.players.map((p) => ({ id: p.id, title: p.name, subtitle: p.team?.name || "", href: `/players/${p.id}` })) },
        { key: "teams", label: "Teams", icon: Shield, items: results.teams.map((t) => ({ id: t.id, title: t.name, subtitle: t.group_name ? `Group ${t.group_name}` : "", href: `/teams/${t.id}` })) },
        { key: "matches", label: "Matches", icon: Calendar, items: results.matches.map((m) => ({ id: m.id, title: `${m.home_team?.name} vs ${m.away_team?.name}`, subtitle: m.status, href: `/matches/${m.id}` })) },
        { key: "records", label: "Records", icon: Trophy, items: [
          ...results.broken.map((r) => ({ id: r.id, title: r.title, subtitle: "Broken", href: `/records/broken/${r.id}` })),
          ...results.created.map((r) => ({ id: r.id, title: r.title, subtitle: "New", href: `/records/new/${r.id}` })),
        ]},
      ]
    : [];

  const totalResults = sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-3">Search</h1>
        <p className="text-white/60 mb-6">Find players, teams, matches, and records instantly.</p>
        <SearchBar defaultValue={query} autoFocus />
      </div>

      {query && results && (
        <div>
          <p className="text-white/40 text-sm mb-6">
            {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>

          {totalResults === 0 ? (
            <div className="glass rounded-2xl p-12 text-center text-white/40">
              No results found. Try a different search term.
            </div>
          ) : (
            sections
              .filter((s) => s.items.length > 0)
              .map((section) => (
                <div key={section.key} className="mb-8">
                  <h2 className="flex items-center gap-2 text-lg font-bold mb-3">
                    <section.icon className="w-5 h-5 text-accent" />
                    {section.label}
                  </h2>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="block glass glass-hover rounded-xl p-4"
                      >
                        <div className="font-semibold">{item.title}</div>
                        {item.subtitle && <div className="text-sm text-white/40">{item.subtitle}</div>}
                      </Link>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
