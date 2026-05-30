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
  const auth = getStoredAuth();
  const authorizationHeader: Record<string, string> = auth?.access_token ? { Authorization: `Bearer ${auth.access_token}` } : {};

  const mergedHeaders =
    extra instanceof Headers
      ? new Headers({ ...baseHeaders, ...authorizationHeader, ...Object.fromEntries(extra.entries()) })
      : { ...baseHeaders, ...authorizationHeader, ...(extra as Record<string, string>) };

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

export async function getTournaments(): Promise<Tournament[]> {
  const res = await fetch(
    "/api/tournaments",
    withCricHeroesHeaders({
      method: "POST",
    })
  );
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export type AuthUser = {
  id: number;
  organiser_id: number;
  username: string;
  email: string;
  mobile: string;
  access_token?: string;
};

export type LoginPayload = {
  organiser_id: number;
  username: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  email: string;
  mobile: string;
};

type AuthSession = {
  user: AuthUser;
  access_token: string;
};

const AUTH_STORAGE_KEY = "schedule.auth";

export function getStoredAuth(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setStoredAuth(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  const res = await fetch(
    "/api/auth/login",
    withCricHeroesHeaders({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status}`);
  }
  return res.json();
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const res = await fetch(
    "/api/auth/register",
    withCricHeroesHeaders({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
  if (!res.ok) {
    throw new Error(`Registration failed: ${res.status}`);
  }
  return res.json();
}

export type RemainingFixture = { team1: string; team2: string };

export type TeamOpponent = {
  name: string;
  id?: number | string | null;
  upcoming: boolean;
  date?: string | null;
  time?: string | null;
  datetime?: string | null;
  match_date?: string | null;
  match_time?: string | null;
  match_datetime?: string | null;
  match_start_time?: string | number | null;
};

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
export async function searchTeam(payload: any) {
  // Use the same API_BASE URL path configuration you already have inside api.ts
  const response = await fetch(`api/search-team`,
    withCricHeroesHeaders({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ team_name: payload.team_name }),
    })
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to search teams");
  }

  return response.json();
}

export type Organiser = {
  id: number;
  organiser_id: number;
  username: string;
  email: string;
  mobile: string;
};

export async function getAdminOrganisers(): Promise<Organiser[]> {
  const response = await fetch(`/api/admin/organisers`, withCricHeroesHeaders({
    method: "GET",
  }));

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load organisers");
  }

  return response.json();
}
