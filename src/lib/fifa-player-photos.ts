import { unstable_cache } from "next/cache";

/** FIFA World Cup 2026 — men's tournament IDs from api.fifa.com */
const FIFA_COMPETITION_ID = "17";
const FIFA_SEASON_ID = "285023";

const FIFA_ALL_SQUADS = `https://api.fifa.com/api/v3/teams/squads/all/${FIFA_COMPETITION_ID}/${FIFA_SEASON_ID}?language=en&count=500`;

export interface FifaPhotoCatalog {
  /** FIFA IdPlayer → full digitalhub URL */
  byPlayerId: Record<string, string>;
  /** normalized display name → full digitalhub URL */
  byName: Record<string, string>;
}

interface FifaSquadPlayer {
  IdPlayer?: string;
  PlayerName?: Array<{ Description?: string }>;
  PlayerPicture?: { PictureUrl?: string };
}

interface FifaSquadTeam {
  Players?: FifaSquadPlayer[];
}

export function normalizePlayerName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Square or head-focused crop from FIFA digitalhub (gravity: top). */
export function fifaPhotoSized(
  url: string,
  width: number,
  options?: { heightRatio?: number }
): string {
  const base = url.split("?")[0];
  const w = Math.min(960, Math.max(128, Math.round(width)));
  const ratio = options?.heightRatio ?? 1;
  const h = Math.round(w * ratio);
  const param = `io=transform:fill,width:${w},height:${h},gravity:top`;
  return `${base}?${param}`;
}

/** Sharp FIFA URL sized for an on-screen avatar. Face mode uses a shorter crop (head-first). */
export function fifaPhotoDisplayUrl(
  rawUrl: string,
  displaySize: number,
  crop: "face" | "full" = "face"
): string {
  const retina = displaySize < 56 ? 3 : 2;
  const width = Math.ceil(displaySize * retina * (crop === "face" ? 2.4 : 1.6));
  return fifaPhotoSized(rawUrl, width, {
    heightRatio: crop === "face" ? 0.78 : 1,
  });
}

async function fetchFifaPhotoCatalog(): Promise<FifaPhotoCatalog> {
  const byPlayerId: Record<string, string> = {};
  const byName: Record<string, string> = {};

  try {
    const res = await fetch(FIFA_ALL_SQUADS, { next: { revalidate: 3600 } });
    if (!res.ok) return { byPlayerId, byName };

    const json = (await res.json()) as { Results?: FifaSquadTeam[] };

    for (const team of json.Results ?? []) {
      for (const player of team.Players ?? []) {
        const url = player.PlayerPicture?.PictureUrl;
        const id = player.IdPlayer;
        const name = player.PlayerName?.[0]?.Description;
        if (!url || !name) continue;

        if (id) byPlayerId[id] = url;
        byName[normalizePlayerName(name)] = url;
      }
    }
  } catch {
    return { byPlayerId, byName };
  }

  return { byPlayerId, byName };
}

export const getCachedFifaPlayerPhotos = unstable_cache(
  fetchFifaPhotoCatalog,
  ["fifa-wc2026-player-photos"],
  { revalidate: 3600 }
);

export function fifaPhotoFor(
  catalog: FifaPhotoCatalog,
  name: string,
  options?: { fifaPlayerId?: string }
): string | null {
  const raw =
    (options?.fifaPlayerId && catalog.byPlayerId[options.fifaPlayerId]) ||
    catalog.byName[normalizePlayerName(name)] ||
    null;

  if (!raw) return null;
  return raw;
}
