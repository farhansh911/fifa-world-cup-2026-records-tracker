import type { Match, Team } from "@/types/database";
import { buildKnockoutBracketView } from "@/lib/bracket";
import { buildGroupStandings, type GroupStandings } from "@/lib/group-standings";
import { getFlagUrl, getTeamCode } from "@/lib/team-codes";

function emptyTeamStats() {
  return {
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

function lookupTeam(name: string, standings: GroupStandings[], matches: Match[]): Team {
  for (const g of standings) {
    const row = g.rows.find((r) => r.name === name);
    if (row) {
      return {
        id: row.teamId,
        name: row.name,
        code: row.code,
        flag_url: row.flag_url,
        group_name: g.group,
        ...emptyTeamStats(),
      };
    }
  }

  for (const m of matches) {
    for (const side of [m.home_team, m.away_team]) {
      if (side?.name === name) {
        return { ...side, ...emptyTeamStats(), id: side.id };
      }
    }
  }

  const code = getTeamCode(name);
  return {
    id: `wc-${code.toLowerCase()}-${name.replace(/\s+/g, "-").toLowerCase()}`,
    name,
    code,
    flag_url: getFlagUrl(name),
    group_name: null,
    ...emptyTeamStats(),
  };
}

/** Replace knockout placeholder team names with resolved qualifiers once group stage ends. */
export function enrichKnockoutMatches(matches: Match[]): Match[] {
  const standings = buildGroupStandings(matches);
  const knockoutView = buildKnockoutBracketView(matches, standings);
  const viewById = new Map(knockoutView.map((v) => [v.id, v]));

  return matches.map((m) => {
    const view = viewById.get(m.id);
    if (!view) return m;

    let homeTeam = m.home_team;
    let awayTeam = m.away_team;

    if (view.home.team && view.home.resolved) {
      homeTeam = lookupTeam(view.home.team, standings, matches);
    }
    if (view.away.team && view.away.resolved) {
      awayTeam = lookupTeam(view.away.team, standings, matches);
    }

    if (homeTeam === m.home_team && awayTeam === m.away_team) return m;

    return {
      ...m,
      home_team: homeTeam,
      away_team: awayTeam,
      home_team_id: homeTeam?.id ?? m.home_team_id,
      away_team_id: awayTeam?.id ?? m.away_team_id,
    };
  });
}
