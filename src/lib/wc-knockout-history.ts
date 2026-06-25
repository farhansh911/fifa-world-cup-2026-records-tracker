import { canonicalTeamName } from "@/lib/team-aliases";

/**
 * Nations that reached the World Cup knockout stage (Round of 16 or later) at least once
 * before the 2026 tournament. Everyone else earns a "first knockout appearance" milestone
 * when they qualify for the 2026 Round of 32.
 */
const REACHED_KNOCKOUT_BEFORE_2026 = new Set([
  "Algeria",
  "Argentina",
  "Australia",
  "Austria",
  "Belgium",
  "Brazil",
  "Bulgaria",
  "Cameroon",
  "Canada",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Croatia",
  "Czechia",
  "Denmark",
  "Ecuador",
  "England",
  "France",
  "Germany",
  "Ghana",
  "Greece",
  "Honduras",
  "Hungary",
  "Iceland",
  "Italy",
  "Japan",
  "Korea Republic",
  "Mexico",
  "Morocco",
  "Netherlands",
  "Nigeria",
  "Norway",
  "Paraguay",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Scotland",
  "Senegal",
  "Serbia",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
  "Switzerland",
  "Turkiye",
  "Ukraine",
  "United States",
  "Uruguay",
  "Wales",
]);

export function hasReachedKnockoutBefore2026(teamName: string): boolean {
  return REACHED_KNOCKOUT_BEFORE_2026.has(canonicalTeamName(teamName));
}

export function isFirstKnockoutQualification(teamName: string): boolean {
  return !hasReachedKnockoutBefore2026(teamName);
}
