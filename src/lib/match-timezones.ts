/** IANA timezone for each 2026 World Cup host city slug (TheStatsAPI). */
const HOST_CITY_TIMEZONES: Record<string, string> = {
  atlanta: "America/New_York",
  boston: "America/New_York",
  miami: "America/New_York",
  "new-york": "America/New_York",
  philadelphia: "America/New_York",
  dallas: "America/Chicago",
  houston: "America/Chicago",
  "kansas-city": "America/Chicago",
  toronto: "America/Toronto",
  vancouver: "America/Vancouver",
  "los-angeles": "America/Los_Angeles",
  "san-francisco": "America/Los_Angeles",
  seattle: "America/Los_Angeles",
  guadalajara: "America/Mexico_City",
  monterrey: "America/Monterrey",
  "mexico-city": "America/Mexico_City",
};

const DEFAULT_TIMEZONE = "America/New_York";

const dateTimeOptions = {
  month: "short" as const,
  day: "numeric" as const,
  hour: "numeric" as const,
  minute: "2-digit" as const,
  timeZoneName: "short" as const,
};

const timeOptions = {
  hour: "numeric" as const,
  minute: "2-digit" as const,
  timeZoneName: "short" as const,
};

export function getHostCityTimeZone(hostCity?: string | null): string {
  if (!hostCity) return DEFAULT_TIMEZONE;
  return HOST_CITY_TIMEZONES[hostCity] ?? DEFAULT_TIMEZONE;
}

/** Stadium-local kickoff (SSR-safe). */
export function formatMatchTime(kickoffUtc: string, hostCity?: string | null): string {
  return new Intl.DateTimeFormat("en-US", {
    ...timeOptions,
    timeZone: getHostCityTimeZone(hostCity),
  }).format(new Date(kickoffUtc));
}

export function formatMatchDateTime(kickoffUtc: string, hostCity?: string | null): string {
  return new Intl.DateTimeFormat("en-US", {
    ...dateTimeOptions,
    timeZone: getHostCityTimeZone(hostCity),
  }).format(new Date(kickoffUtc));
}

/** Viewer-local kickoff — use in client components only. */
export function formatViewerDateTime(kickoffUtc: string): string {
  return new Intl.DateTimeFormat("en-US", dateTimeOptions).format(new Date(kickoffUtc));
}

export function formatViewerTime(kickoffUtc: string): string {
  return new Intl.DateTimeFormat("en-US", timeOptions).format(new Date(kickoffUtc));
}

export function formatMatchDateHeader(
  kickoffUtc: string,
  hostCity?: string | null,
  viewerLocal = false
): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    ...(viewerLocal ? {} : { timeZone: getHostCityTimeZone(hostCity) }),
  }).format(new Date(kickoffUtc));
}

export function viewerDiffersFromStadium(kickoffUtc: string, hostCity?: string | null): boolean {
  if (typeof window === "undefined") return false;
  const viewerTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const stadiumTz = getHostCityTimeZone(hostCity);
  if (viewerTz === stadiumTz) return false;

  const date = new Date(kickoffUtc);
  const viewer = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  const stadium = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZone: stadiumTz,
  }).format(date);
  return viewer !== stadium;
}

/** Group key: calendar date in the stadium's local timezone. */
export function matchLocalDateKey(kickoffUtc: string, hostCity?: string | null): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: getHostCityTimeZone(hostCity),
  }).format(new Date(kickoffUtc));
}
