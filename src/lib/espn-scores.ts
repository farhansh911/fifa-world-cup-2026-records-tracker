import type { MatchStatus } from "@/types/database";
import { buildMatchKey, buildDayMatchKey, canonicalTeamName, mapEspnMatchState } from "@/lib/team-aliases";

const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

export interface ScoreOverlay {
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  minute: number | null;
  attendance: number | null;
}

export interface EspnFixtureRef {
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  overlay: ScoreOverlay;
}

export interface EspnFetchResult {
  overlays: Map<string, ScoreOverlay>;
  /** Exact kickoff ISO and hour-bucket keys → teams (for knockout placeholder fallback). */
  byKickoff: Map<string, EspnFixtureRef>;
}

interface EspnEvent {
  date: string;
  competitions: Array<{
    date: string;
    attendance?: number;
    status: {
      clock?: number;
      displayClock?: string;
      type: { state: string; description: string };
    };
    competitors: Array<{
      homeAway: "home" | "away";
      score: string;
      team: { displayName: string; shortDisplayName: string };
    }>;
  }>;
}

function tournamentDates(): string[] {
  const dates: string[] = [];
  const start = new Date("2026-06-11T00:00:00Z");
  const end = new Date("2026-07-19T00:00:00Z");
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    dates.push(`${y}${m}${day}`);
  }
  return dates;
}

function mapEspnStatus(state: string, description: string): MatchStatus {
  return mapEspnMatchState(state, description);
}

function parseMinute(displayClock?: string, clockSeconds?: number): number | null {
  if (displayClock) {
    const match = displayClock.match(/^(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  if (clockSeconds != null && clockSeconds > 0) {
    return Math.floor(clockSeconds / 60);
  }
  return null;
}

function eventToOverlay(event: EspnEvent): ScoreOverlay | null {
  const competition = event.competitions?.[0];
  if (!competition) return null;

  const home = competition.competitors.find((c) => c.homeAway === "home");
  const away = competition.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const homeScore = parseInt(home.score, 10);
  const awayScore = parseInt(away.score, 10);
  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) return null;

  const status = mapEspnStatus(competition.status.type.state, competition.status.type.description);

  return {
    homeScore,
    awayScore,
    status,
    minute: status === "live" ? parseMinute(competition.status.displayClock, competition.status.clock) : null,
    attendance: competition.attendance ?? null,
  };
}

async function fetchEspnDate(date: string): Promise<EspnEvent[]> {
  try {
    const res = await fetch(`${ESPN_SCOREBOARD}?dates=${date}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { events?: EspnEvent[] };
    return json.events ?? [];
  } catch {
    return [];
  }
}

function kickoffHourKey(dateIso: string): string {
  const d = new Date(dateIso);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}`;
}

function addOverlayFromEvent(
  map: Map<string, ScoreOverlay>,
  byKickoff: Map<string, EspnFixtureRef>,
  event: EspnEvent
): void {
  const competition = event.competitions?.[0];
  if (!competition) return;

  const home = competition.competitors.find((c) => c.homeAway === "home");
  const away = competition.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return;

  const overlay = eventToOverlay(event);
  if (!overlay) return;

  const kickoff = competition.date || event.date;
  const homeName = canonicalTeamName(home.team.displayName);
  const awayName = canonicalTeamName(away.team.displayName);
  const ref: EspnFixtureRef = { homeTeam: homeName, awayTeam: awayName, kickoff, overlay };

  byKickoff.set(kickoff, ref);
  byKickoff.set(kickoffHourKey(kickoff), ref);

  const keys = [
    buildMatchKey(homeName, awayName, kickoff),
    buildDayMatchKey(homeName, awayName, kickoff),
  ];
  for (const key of keys) {
    map.set(key, overlay);
  }
}

async function collectEspnEvents(): Promise<EspnEvent[]> {
  const today = new Date();
  const nearbyDates = [-1, 0, 1].map((offset) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + offset);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  });

  const allDates = tournamentDates();
  const remainingDates = allDates.filter((d) => !nearbyDates.includes(d));

  const [defaultEvents, nearbyEvents, remainingEvents] = await Promise.all([
    fetch(`${ESPN_SCOREBOARD}`, { next: { revalidate: 15 } })
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((json: { events?: EspnEvent[] }) => json.events ?? [])
      .catch(() => [] as EspnEvent[]),
    Promise.all(nearbyDates.map(fetchEspnDate)),
    Promise.all(remainingDates.map(fetchEspnDate)),
  ]);

  return [...defaultEvents, ...nearbyEvents.flat(), ...remainingEvents.flat()];
}

export async function fetchEspnData(): Promise<EspnFetchResult> {
  const events = await collectEspnEvents();
  const overlays = new Map<string, ScoreOverlay>();
  const byKickoff = new Map<string, EspnFixtureRef>();

  for (const event of events) {
    addOverlayFromEvent(overlays, byKickoff, event);
  }

  return { overlays, byKickoff };
}

export async function fetchEspnScoreOverlays(): Promise<Map<string, ScoreOverlay>> {
  const { overlays } = await fetchEspnData();
  return overlays;
}
