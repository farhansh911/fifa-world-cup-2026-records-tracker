import type { MatchStatus } from "@/types/database";
import { buildDayMatchKey, buildMatchKey, canonicalTeamName } from "@/lib/team-aliases";

const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

export interface EspnEventRecord {
  eventId: string;
  homeName: string;
  awayName: string;
  kickoff: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  minute: number | null;
  clock: string;
  statusDetail: string;
  venue: string;
}

interface EspnEvent {
  id: string;
  date: string;
  competitions: Array<{
    id: string;
    date: string;
    venue?: { fullName?: string };
    status: {
      displayClock?: string;
      clock?: number;
      type: { state: string; description: string; shortDetail?: string };
    };
    competitors: Array<{
      homeAway: "home" | "away";
      score: string;
      team: { displayName: string };
    }>;
  }>;
}

function mapState(state: string): MatchStatus {
  if (state === "in") return "live";
  if (state === "post") return "completed";
  return "scheduled";
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

function parseEvent(event: EspnEvent): EspnEventRecord | null {
  const comp = event.competitions?.[0];
  if (!comp) return null;

  const home = comp.competitors.find((c) => c.homeAway === "home");
  const away = comp.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const status = mapState(comp.status.type.state);
  const kickoff = comp.date || event.date;

  return {
    eventId: event.id,
    homeName: canonicalTeamName(home.team.displayName),
    awayName: canonicalTeamName(away.team.displayName),
    kickoff,
    status,
    homeScore: parseInt(home.score, 10) || 0,
    awayScore: parseInt(away.score, 10) || 0,
    minute: status === "live" ? parseMinute(comp.status.displayClock, comp.status.clock) : null,
    clock: comp.status.displayClock ?? comp.status.type.shortDetail ?? "",
    statusDetail: comp.status.type.description,
    venue: comp.venue?.fullName ?? "",
  };
}

async function fetchScoreboard(url: string): Promise<EspnEvent[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 15 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { events?: EspnEvent[] };
    return json.events ?? [];
  } catch {
    return [];
  }
}

function formatEspnDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function addEventToMap(map: Map<string, EspnEventRecord>, event: EspnEvent): void {
  const record = parseEvent(event);
  if (!record) return;

  const keys = [
    buildMatchKey(record.homeName, record.awayName, record.kickoff),
    buildDayMatchKey(record.homeName, record.awayName, record.kickoff),
  ];
  for (const key of keys) {
    map.set(key, record);
  }
}

function lookupInMap(
  map: Map<string, EspnEventRecord>,
  home: string,
  away: string,
  kickoffUtc: string
): EspnEventRecord | undefined {
  return (
    map.get(buildMatchKey(home, away, kickoffUtc)) ??
    map.get(buildDayMatchKey(home, away, kickoffUtc))
  );
}

/** Find ESPN event for any tournament match, including past fixtures. */
export async function lookupEspnEventForMatch(
  home: string,
  away: string,
  kickoffUtc: string,
  recentEvents?: Map<string, EspnEventRecord>
): Promise<EspnEventRecord | undefined> {
  if (recentEvents) {
    const cached = lookupInMap(recentEvents, home, away, kickoffUtc);
    if (cached) return cached;
  }

  const kickoff = new Date(kickoffUtc);
  const dateParams = [-1, 0, 1].map((offset) => {
    const d = new Date(kickoff);
    d.setUTCDate(d.getUTCDate() + offset);
    return formatEspnDate(d);
  });

  const batches = await Promise.all(
    dateParams.map((date) => fetchScoreboard(`${ESPN_SCOREBOARD}?dates=${date}`))
  );

  const map = new Map<string, EspnEventRecord>();
  for (const events of batches) {
    for (const event of events) {
      addEventToMap(map, event);
    }
  }

  return lookupInMap(map, home, away, kickoffUtc);
}

export async function fetchEspnEvents(): Promise<Map<string, EspnEventRecord>> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const dateParams = [
    formatEspnDate(yesterday),
    formatEspnDate(today),
    formatEspnDate(tomorrow),
  ];

  const [defaultEvents, ...datedBatches] = await Promise.all([
    fetchScoreboard(ESPN_SCOREBOARD),
    ...dateParams.map((date) => fetchScoreboard(`${ESPN_SCOREBOARD}?dates=${date}`)),
  ]);

  const map = new Map<string, EspnEventRecord>();

  // Default scoreboard is the most reliable source for in-progress matches.
  for (const event of defaultEvents) {
    addEventToMap(map, event);
  }

  for (const events of datedBatches) {
    for (const event of events) {
      addEventToMap(map, event);
    }
  }

  return map;
}

export async function fetchLiveEspnEvents(): Promise<EspnEventRecord[]> {
  const all = await fetchEspnEvents();
  return [...all.values()].filter((e) => e.status === "live");
}
