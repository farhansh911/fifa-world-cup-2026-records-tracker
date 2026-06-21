import { unstable_cache } from "next/cache";
import type { Match, MatchStatus, Team } from "@/types/database";
import { fetchEspnScoreOverlays, type ScoreOverlay } from "@/lib/espn-scores";
import { buildMatchKey, buildDayMatchKey, canonicalTeamName } from "@/lib/team-aliases";
import { formatHostCity, getFlagUrl, getTeamCode } from "@/lib/team-codes";

const FIXTURES_URL = "https://www.thestatsapi.com/world-cup/data/fixtures.json";
const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";
const MATCH_DURATION_MS = 105 * 60 * 1000;

interface StatsApiFixture {
  matchNumber: number;
  date: string;
  kickoffUtc: string;
  stage: string;
  group?: string;
  homeTeam: string;
  awayTeam: string;
  stadium: string;
  hostCity: string;
}

interface ApiFootballFixture {
  fixture: {
    date: string;
    status: { short: string; elapsed: number | null };
  };
  teams: {
    home: { name: string; logo: string };
    away: { name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
}

function makeTeam(name: string, group: string | null): Team {
  const code = getTeamCode(name);
  return {
    id: `wc-${code.toLowerCase()}-${name.replace(/\s+/g, "-").toLowerCase()}`,
    name,
    code,
    flag_url: getFlagUrl(name),
    group_name: group,
    matches_played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    created_at: "",
    updated_at: "",
  };
}

function mapApiFootballStatus(short: string): MatchStatus {
  if (["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"].includes(short)) return "live";
  if (["FT", "AET", "PEN"].includes(short)) return "completed";
  if (["PST", "CANC", "ABD"].includes(short)) return "postponed";
  return "scheduled";
}

function lookupOverlay<T>(map: Map<string, T>, home: string, away: string, kickoffUtc: string): T | undefined {
  return (
    map.get(buildMatchKey(home, away, kickoffUtc)) ??
    map.get(buildDayMatchKey(home, away, kickoffUtc))
  );
}

function inferStatusWithoutScores(kickoffUtc: string): MatchStatus {
  const kickoff = new Date(kickoffUtc).getTime();
  const now = Date.now();
  if (now < kickoff) return "scheduled";
  if (now >= kickoff && now <= kickoff + MATCH_DURATION_MS) return "live";
  return "scheduled";
}

function applyOverlay(
  match: Match,
  overlay: ScoreOverlay | ApiFootballFixture | undefined,
  source: "espn" | "api-football"
): Match {
  if (!overlay) return match;

  if (source === "espn") {
    const o = overlay as ScoreOverlay;
    const hasScores = o.status !== "scheduled";
    return {
      ...match,
      home_score: hasScores ? o.homeScore : null,
      away_score: hasScores ? o.awayScore : null,
      status: o.status,
      minute: o.minute,
      attendance: o.attendance ?? match.attendance,
    };
  }

  const o = overlay as ApiFootballFixture;
  const homeTeam = { ...match.home_team! };
  const awayTeam = { ...match.away_team! };
  if (o.teams.home.logo) homeTeam.flag_url = o.teams.home.logo;
  if (o.teams.away.logo) awayTeam.flag_url = o.teams.away.logo;

  return {
    ...match,
    home_score: o.goals.home,
    away_score: o.goals.away,
    status: mapApiFootballStatus(o.fixture.status.short),
    minute: o.fixture.status.elapsed,
    home_team: homeTeam,
    away_team: awayTeam,
  };
}

async function fetchApiFootballOverlay(): Promise<Map<string, ApiFootballFixture>> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return new Map();

  try {
    const res = await fetch(`${API_FOOTBALL_BASE}/fixtures?league=1&season=2026`, {
      headers: { "x-apisports-key": key },
      next: { revalidate: 60 },
    });
    if (!res.ok) return new Map();

    const json = (await res.json()) as { response?: ApiFootballFixture[] };
    const map = new Map<string, ApiFootballFixture>();
    for (const item of json.response ?? []) {
      const home = canonicalTeamName(item.teams.home.name);
      const away = canonicalTeamName(item.teams.away.name);
      const keys = [
        buildMatchKey(home, away, item.fixture.date),
        buildDayMatchKey(home, away, item.fixture.date),
      ];
      for (const key of keys) {
        map.set(key, item);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function statsFixtureToMatch(f: StatsApiFixture): Match {
  const homeTeam = makeTeam(f.homeTeam, f.group ?? null);
  const awayTeam = makeTeam(f.awayTeam, f.group ?? null);
  const venue = formatHostCity(f.hostCity);
  const now = new Date().toISOString();

  return {
    id: `wc2026-${f.matchNumber}`,
    home_team_id: homeTeam.id,
    away_team_id: awayTeam.id,
    home_score: null,
    away_score: null,
    status: inferStatusWithoutScores(f.kickoffUtc),
    minute: null,
    stadium: f.stadium,
    venue,
    host_city: f.hostCity,
    group_name: f.group ?? null,
    match_date: f.kickoffUtc,
    attendance: null,
    goalscorers: null,
    summary: f.stage.replace(/-/g, " "),
    created_at: now,
    updated_at: now,
    home_team: homeTeam,
    away_team: awayTeam,
  };
}

async function loadFixtures(): Promise<Match[]> {
  const [fixturesRes, espnOverlays, apiFootballOverlays] = await Promise.all([
    fetch(FIXTURES_URL, { next: { revalidate: 3600 } }),
    fetchEspnScoreOverlays(),
    fetchApiFootballOverlay(),
  ]);

  if (!fixturesRes.ok) throw new Error(`Fixtures API failed: ${fixturesRes.status}`);

  const json = (await fixturesRes.json()) as { fixtures: StatsApiFixture[] };

  return json.fixtures.map((f) => {
    let match = statsFixtureToMatch(f);

    const espn = lookupOverlay(espnOverlays, f.homeTeam, f.awayTeam, f.kickoffUtc);
    if (espn) {
      match = applyOverlay(match, espn, "espn");
    }

    const apiFootball = lookupOverlay(apiFootballOverlays, f.homeTeam, f.awayTeam, f.kickoffUtc);
    if (apiFootball) {
      match = applyOverlay(match, apiFootball, "api-football");
    }

    return match;
  });
}

export const getCachedWorldCupMatches = unstable_cache(loadFixtures, ["wc2026-fixtures-v6"], {
  revalidate: 30,
});

export async function getWorldCupMatches(): Promise<Match[]> {
  try {
    return await getCachedWorldCupMatches();
  } catch (error) {
    console.error("Failed to load World Cup fixtures:", error);
    return [];
  }
}
