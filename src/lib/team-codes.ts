/** FIFA team name → ISO 3166-1 alpha-2 for flagcdn.com */
const TEAM_ISO: Record<string, string> = {
  Algeria: "dz",
  Argentina: "ar",
  Australia: "au",
  Austria: "at",
  Belgium: "be",
  "Bosnia and Herzegovina": "ba",
  Brazil: "br",
  "Cabo Verde": "cv",
  Canada: "ca",
  Colombia: "co",
  "Congo DR": "cd",
  "Cote d'Ivoire": "ci",
  Croatia: "hr",
  Curacao: "cw",
  Czechia: "cz",
  Ecuador: "ec",
  Egypt: "eg",
  England: "gb-eng",
  France: "fr",
  Germany: "de",
  Ghana: "gh",
  Haiti: "ht",
  "IR Iran": "ir",
  Iraq: "iq",
  Japan: "jp",
  Jordan: "jo",
  "Korea Republic": "kr",
  Mexico: "mx",
  Morocco: "ma",
  Netherlands: "nl",
  "New Zealand": "nz",
  Norway: "no",
  Panama: "pa",
  Paraguay: "py",
  Portugal: "pt",
  Qatar: "qa",
  "Saudi Arabia": "sa",
  Scotland: "gb-sct",
  Senegal: "sn",
  "South Africa": "za",
  Spain: "es",
  Sweden: "se",
  Switzerland: "ch",
  Tunisia: "tn",
  Turkiye: "tr",
  "United States": "us",
  Uruguay: "uy",
  Uzbekistan: "uz",
};

export function getTeamCode(name: string): string {
  const iso = TEAM_ISO[name];
  if (iso) return iso.toUpperCase().replace("GB-ENG", "ENG").replace("GB-SCT", "SCO");
  if (name.startsWith("Group ") || name.startsWith("Winner ") || name.startsWith("Loser ")) {
    return "TBD";
  }
  return name.slice(0, 3).toUpperCase();
}

export function getFlagUrl(name: string): string | null {
  const iso = TEAM_ISO[name];
  if (!iso) return null;
  return `https://flagcdn.com/w80/${iso}.png`;
}

export function formatHostCity(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
