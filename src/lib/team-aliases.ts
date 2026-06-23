/** Map external provider team labels to our canonical FIFA names. */
import type { MatchStatus } from "@/types/database";

const TEAM_ALIASES: Record<string, string> = {
  "South Korea": "Korea Republic",
  "Korea Republic": "Korea Republic",
  USA: "United States",
  "United States": "United States",
  "Bosnia-Herz": "Bosnia and Herzegovina",
  "Bosnia-Herzegovina": "Bosnia and Herzegovina",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",
  "Ivory Coast": "Cote d'Ivoire",
  "Côte d'Ivoire": "Cote d'Ivoire",
  "Cote d'Ivoire": "Cote d'Ivoire",
  Türkiye: "Turkiye",
  Turkey: "Turkiye",
  Turkiye: "Turkiye",
  Curaçao: "Curacao",
  Curacao: "Curacao",
  Iran: "IR Iran",
  "IR Iran": "IR Iran",
  "Cape Verde": "Cabo Verde",
  "Cabo Verde": "Cabo Verde",
  "DR Congo": "Congo DR",
  "Congo DR": "Congo DR",
  "Democratic Republic of the Congo": "Congo DR",
  "Saudi Arabia": "Saudi Arabia",
  KSA: "Saudi Arabia",
  Mexico: "Mexico",
  Czechia: "Czechia",
  "Czech Republic": "Czechia",
  "South Africa": "South Africa",
  Scotland: "Scotland",
  Morocco: "Morocco",
  Brazil: "Brazil",
  Haiti: "Haiti",
  Paraguay: "Paraguay",
  Canada: "Canada",
  Qatar: "Qatar",
  Switzerland: "Switzerland",
  Australia: "Australia",
  Germany: "Germany",
  Netherlands: "Netherlands",
  Japan: "Japan",
  Ecuador: "Ecuador",
  Sweden: "Sweden",
  Tunisia: "Tunisia",
  Spain: "Spain",
  Belgium: "Belgium",
  Egypt: "Egypt",
  Uruguay: "Uruguay",
  "New Zealand": "New Zealand",
  France: "France",
  Senegal: "Senegal",
  Iraq: "Iraq",
  Norway: "Norway",
  Argentina: "Argentina",
  Algeria: "Algeria",
  Austria: "Austria",
  Jordan: "Jordan",
  Portugal: "Portugal",
  England: "England",
  Croatia: "Croatia",
  Ghana: "Ghana",
  Panama: "Panama",
  Colombia: "Colombia",
  Uzbekistan: "Uzbekistan",
};

export function canonicalTeamName(name: string): string {
  const trimmed = name.trim();
  return TEAM_ALIASES[trimmed] ?? trimmed;
}

export function buildMatchKey(home: string, away: string, dateIso: string): string {
  const d = new Date(dateIso);
  const bucket = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}`;
  return `${canonicalTeamName(home).toLowerCase()}|${canonicalTeamName(away).toLowerCase()}|${bucket}`;
}

/** Same teams on the same UTC day — handles kickoff time drift between providers. */
export function buildDayMatchKey(home: string, away: string, dateIso: string): string {
  const d = new Date(dateIso);
  const bucket = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
  return `${canonicalTeamName(home).toLowerCase()}|${canonicalTeamName(away).toLowerCase()}|${bucket}`;
}

export function isUpcomingKickoff(matchDate: string, now = Date.now()): boolean {
  return new Date(matchDate).getTime() > now;
}

export function hasMatchScore(homeScore: number | null, awayScore: number | null): boolean {
  return homeScore != null && awayScore != null;
}

/** Map ESPN status.type.state + description to our match status. */
export function mapEspnMatchState(state: string, description = ""): MatchStatus {
  const desc = description.toLowerCase();
  if (state === "post") return "completed";
  if (state === "in") return "live";
  if (/suspend|halftime|half time|extra time|penalt|stoppage|intermission/i.test(desc)) return "live";
  if (/postpon|cancel|abandon|delayed/i.test(desc)) return "postponed";
  return "scheduled";
}

export function isInterruptedMatchStatus(statusDetail: string): boolean {
  return /suspend|stoppage|weather|delay|halftime|half time|intermission/i.test(statusDetail.toLowerCase());
}

export function formatScoreLine(
  status: string,
  homeScore: number | null,
  awayScore: number | null
): string | null {
  if (status === "scheduled" || status === "postponed" || status === "upcoming") return null;
  if (!hasMatchScore(homeScore, awayScore)) return null;
  return `${homeScore}–${awayScore}`;
}
