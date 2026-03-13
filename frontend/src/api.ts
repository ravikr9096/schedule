const CRICHEROES_API_KEY = "cr!CkH3r0s";
const CRICHEROES_DEVICE_TYPE = "Chrome: 145.0.0.0";
const DEFAULT_CRICHEROES_UDID = "a52cfc8dc3817cffe3dc1fd4b2f57ec1";
const UDID_STORAGE_KEY = "cricheroes.udid";

let currentUdid =
  localStorage.getItem(UDID_STORAGE_KEY) ?? DEFAULT_CRICHEROES_UDID;

export function getUdid(): string {
  return currentUdid;
}

export function setUdid(udid: string): void {
  const normalized = udid.trim() || DEFAULT_CRICHEROES_UDID;
  currentUdid = normalized;
  localStorage.setItem(UDID_STORAGE_KEY, normalized);
}

function withCricHeroesHeaders(init?: RequestInit): RequestInit {
  const baseHeaders: Record<string, string> = {
    "api-key": CRICHEROES_API_KEY,
    "device-type": CRICHEROES_DEVICE_TYPE,
    udid: currentUdid,
  };

  const extra = init?.headers ?? {};
  const mergedHeaders =
    extra instanceof Headers
      ? new Headers({ ...baseHeaders, ...Object.fromEntries(extra.entries()) })
      : { ...baseHeaders, ...(extra as Record<string, string>) };

  return { ...init, headers: mergedHeaders };
}

export async function getHello(): Promise<{ message: string }> {
  const res = await fetch("/api/hello", withCricHeroesHeaders());
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export type Tournament = { id: number; name: string };

export type TournamentsAuth = {
  organizer_id: number;
  username: string;
  password: string;
};

export async function getTournaments(auth: TournamentsAuth): Promise<Tournament[]> {
  const res = await fetch(
    "/api/tournaments",
    withCricHeroesHeaders({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(auth),
    })
  );
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export type RemainingFixture = { team1: string; team2: string };

export type TeamOpponent = { name: string; upcoming: boolean };

export type TournamentMatchesResponse = {
  tournamentid: number;
  teams: string[];
  played_match_count: number;
  remaining_fixtures: RemainingFixture[];
  team_opponents?: Record<string, TeamOpponent[]>;
};

export async function getTournamentMatches(
  tournamentid: number
): Promise<TournamentMatchesResponse> {
  const res = await fetch(
    "/api/tournament-matches",
    withCricHeroesHeaders({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tournamentid }),
    })
  );
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export type RemainingFixturesResponse = {
  tournamentid: number;
  remaining_fixtures: RemainingFixture[];
  team_opponents: Record<string, TeamOpponent[]>;
};

export async function getRemainingFixtures(
  tournamentid: number
): Promise<RemainingFixturesResponse> {
  const res = await fetch(
    `/api/tournaments/${tournamentid}/remaining-fixtures`,
    withCricHeroesHeaders()
  );
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}
