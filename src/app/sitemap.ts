import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";
import {
  getRecordsBroken,
  getRecordsCreated,
  getTeams,
  getPlayers,
  getAllMatches,
} from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/records/broken`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/records/new`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/matches`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/bracket`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/golden-boot`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/timeline`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${base}/teams`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/players`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/stats`, changeFrequency: "hourly", priority: 0.7 },
    { url: `${base}/search`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const [broken, created, teams, players, matches] = await Promise.all([
      getRecordsBroken(),
      getRecordsCreated(),
      getTeams(),
      getPlayers(),
      getAllMatches(),
    ]);

    const dynamicPages: MetadataRoute.Sitemap = [
      ...broken.map((r) => ({ url: `${base}/records/broken/${r.id}`, changeFrequency: "weekly" as const, priority: 0.7 })),
      ...created.map((r) => ({ url: `${base}/records/new/${r.id}`, changeFrequency: "weekly" as const, priority: 0.7 })),
      ...teams.map((t) => ({ url: `${base}/teams/${t.id}`, changeFrequency: "daily" as const, priority: 0.6 })),
      ...players.map((p) => ({ url: `${base}/players/${p.id}`, changeFrequency: "daily" as const, priority: 0.6 })),
      ...matches.map((m) => ({ url: `${base}/matches/${m.id}`, changeFrequency: "hourly" as const, priority: 0.6 })),
    ];

    return [...staticPages, ...dynamicPages];
  } catch {
    return staticPages;
  }
}
