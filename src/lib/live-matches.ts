import { unstable_cache } from "next/cache";
import type { Match } from "@/types/database";
import { fetchEspnMatchDetail, type EspnMatchDetail } from "@/lib/espn-match-detail";
import { fetchEspnEvents, lookupEspnEventForMatch, type EspnEventRecord } from "@/lib/espn-events";
import { getWorldCupMatches } from "@/lib/fixtures-api";
import { buildDayMatchKey, buildMatchKey, canonicalTeamName } from "@/lib/team-aliases";
import { getFlagUrl, getTeamCode } from "@/lib/team-codes";

export interface LiveMatchView {
  id: string;
  espnEventId: string;
  status: "live" | "scheduled" | "completed" | "postponed";
  statusDetail: string;
  minute: number | null;
  clock: string;
  venue: string;
  stadium: string | null;
  home: {
    name: string;
    code: string;
    flag_url: string | null;
    score: number;
  };
  away: {
    name: string;
    code: string;
    flag_url: string | null;
    score: number;
  };
  homeStats: EspnMatchDetail["homeStats"];
  awayStats: EspnMatchDetail["awayStats"];
  goals: EspnMatchDetail["goals"];
}

function lookupEvent(
  events: Map<string, EspnEventRecord>,
  home: string,
  away: string,
  kickoff: string
): EspnEventRecord | undefined {
  return (
    events.get(buildMatchKey(home, away, kickoff)) ??
    events.get(buildDayMatchKey(home, away, kickoff))
  );
}

const EMPTY_STATS: EspnMatchDetail["homeStats"] = {
  possession: 0,
  shots: 0,
  shotsOnTarget: 0,
  corners: 0,
  fouls: 0,
  yellowCards: 0,
  saves: 0,
};

function viewFromEvent(event: EspnEventRecord, match?: Match): LiveMatchView {
  const homeName = match?.home_team?.name ?? canonicalTeamName(event.homeName);
  const awayName = match?.away_team?.name ?? canonicalTeamName(event.awayName);

  return {
    id: match?.id ?? `espn-${event.eventId}`,
    espnEventId: event.eventId,
    status: event.status,
    statusDetail: event.statusDetail,
    minute: event.minute,
    clock: event.clock,
    venue: match?.venue ?? event.venue,
    stadium: match?.stadium ?? null,
    home: {
      name: homeName,
      code: match?.home_team?.code ?? getTeamCode(homeName),
      flag_url: match?.home_team?.flag_url ?? getFlagUrl(homeName),
      score: event.homeScore,
    },
    away: {
      name: awayName,
      code: match?.away_team?.code ?? getTeamCode(awayName),
      flag_url: match?.away_team?.flag_url ?? getFlagUrl(awayName),
      score: event.awayScore,
    },
    homeStats: { ...EMPTY_STATS },
    awayStats: { ...EMPTY_STATS },
    goals: [],
  };
}

function mergeMatchWithDetail(
  match: Match,
  detail: EspnMatchDetail,
  eventId: string
): LiveMatchView {
  const homeName = match.home_team?.name ?? detail.home.name;
  const awayName = match.away_team?.name ?? detail.away.name;

  return {
    id: match.id,
    espnEventId: eventId,
    status: detail.status,
    statusDetail: detail.statusDetail,
    minute: detail.minute,
    clock: detail.clock,
    venue: match.venue ?? detail.venue,
    stadium: match.stadium,
    home: {
      name: homeName,
      code: match.home_team?.code ?? getTeamCode(homeName),
      flag_url: match.home_team?.flag_url ?? getFlagUrl(homeName),
      score: detail.home.score,
    },
    away: {
      name: awayName,
      code: match.away_team?.code ?? getTeamCode(awayName),
      flag_url: match.away_team?.flag_url ?? getFlagUrl(awayName),
      score: detail.away.score,
    },
    homeStats: detail.homeStats,
    awayStats: detail.awayStats,
    goals: detail.goals,
  };
}

function eventToLiveView(event: EspnEventRecord, detail: EspnMatchDetail): LiveMatchView {
  const homeName = canonicalTeamName(event.homeName);
  const awayName = canonicalTeamName(event.awayName);

  return {
    id: `espn-${event.eventId}`,
    espnEventId: event.eventId,
    status: detail.status,
    statusDetail: detail.statusDetail,
    minute: detail.minute,
    clock: detail.clock,
    venue: detail.venue,
    stadium: null,
    home: {
      name: homeName,
      code: getTeamCode(homeName),
      flag_url: getFlagUrl(homeName),
      score: detail.home.score,
    },
    away: {
      name: awayName,
      code: getTeamCode(awayName),
      flag_url: getFlagUrl(awayName),
      score: detail.away.score,
    },
    homeStats: detail.homeStats,
    awayStats: detail.awayStats,
    goals: detail.goals,
  };
}

async function loadLiveMatchViews(): Promise<LiveMatchView[]> {
  const [matches, espnEvents] = await Promise.all([
    getWorldCupMatches(),
    fetchEspnEvents(),
  ]);

  const liveMatches = matches.filter((m) => m.status === "live");
  const views: LiveMatchView[] = [];
  const seen = new Set<string>();

  for (const match of liveMatches) {
    const home = match.home_team?.name ?? "";
    const away = match.away_team?.name ?? "";
    const event = lookupEvent(espnEvents, home, away, match.match_date);
    if (!event) continue;

    const detail = await fetchEspnMatchDetail(event.eventId);
    if (detail) {
      views.push(mergeMatchWithDetail(match, detail, event.eventId));
    } else {
      views.push(viewFromEvent(event, match));
    }
    seen.add(event.eventId);
  }

  for (const event of espnEvents.values()) {
    if (event.status !== "live" || seen.has(event.eventId)) continue;
    const detail = await fetchEspnMatchDetail(event.eventId);
    if (detail) {
      views.push(eventToLiveView(event, detail));
    } else {
      views.push(viewFromEvent(event));
    }
  }

  return views;
}

export const getCachedLiveViews = unstable_cache(loadLiveMatchViews, ["live-matches-v1"], {
  revalidate: 15,
});

export async function getLiveMatchViews(): Promise<LiveMatchView[]> {
  try {
    return await getCachedLiveViews();
  } catch {
    return [];
  }
}

export async function getMatchLiveView(matchId: string): Promise<LiveMatchView | null> {
  const [matches, espnEvents] = await Promise.all([
    getWorldCupMatches(),
    fetchEspnEvents(),
  ]);

  const match = matches.find((m) => m.id === matchId);
  if (!match) return null;

  const home = match.home_team?.name ?? "";
  const away = match.away_team?.name ?? "";

  const event = await lookupEspnEventForMatch(home, away, match.match_date, espnEvents);
  if (!event) return null;

  const detail = await fetchEspnMatchDetail(event.eventId);
  if (detail) {
    return mergeMatchWithDetail(match, detail, event.eventId);
  }

  return viewFromEvent(event, match);
}

/** Latest completed match with full stats — fallback when nothing is live. */
export async function getFeaturedMatchView(): Promise<LiveMatchView | null> {
  const [matches, espnEvents] = await Promise.all([
    getWorldCupMatches(),
    fetchEspnEvents(),
  ]);

  const recent = matches
    .filter((m) => m.status === "completed")
    .sort((a, b) => b.match_date.localeCompare(a.match_date))[0];

  if (!recent) return null;

  const event = await lookupEspnEventForMatch(
    recent.home_team?.name ?? "",
    recent.away_team?.name ?? "",
    recent.match_date,
    espnEvents
  );
  if (!event) return null;

  const detail = await fetchEspnMatchDetail(event.eventId);
  if (detail) {
    return mergeMatchWithDetail(recent, detail, event.eventId);
  }

  return viewFromEvent(event, recent);
}
