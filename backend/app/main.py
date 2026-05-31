from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.requests import Request
from starlette.exceptions import HTTPException as StarletteHTTPException
import httpx
import asyncio
import json
import os
from pydantic import BaseModel
import itertools
from pathlib import Path
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta, timezone
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

try:
    from team import router as team_router
except ImportError:
    from .team import router as team_router
    
try:
    from matchData import router as matchData_router
except ImportError:
    from .matchData import router as matchData_router

# CricHeroes API headers (used for tournament and match endpoints)
CRICHEROES_API_KEY = "cr!CkH3r0s"
CRICHEROES_DEVICE_TYPE = "Chrome: 145.0.0.0"
CRICHEROES_UDID = "a52cfc8dc3817cffe3dc1fd4b2f57ec1"

CRICHEROES_HEADERS = {
    "api-key": CRICHEROES_API_KEY,
    "device-type": CRICHEROES_DEVICE_TYPE,
    "udid": CRICHEROES_UDID,
}


def _upstream_headers(
    api_key: str | None,
    device_type: str | None,
    udid: str | None,
) -> dict[str, str]:
    return {
        "api-key": api_key or CRICHEROES_API_KEY,
        "device-type": device_type or CRICHEROES_DEVICE_TYPE,
        "udid": udid or CRICHEROES_UDID,
    }

app = FastAPI(title="FastAPI Backend", version="0.1.0")
app.include_router(team_router)
app.include_router(matchData_router)


# ------------------------
# Database & auth helpers
# ------------------------

# Use PBKDF2-SHA256 to avoid bcrypt's 72-byte password limit / backend issues
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

USER_FILE = "user.json"

SECRET_KEY = "your-super-secret-jwt-key"
ALGORITHM = "HS256"
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=7))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def read_users() -> list[dict]:
    if not os.path.exists(USER_FILE):
        return []
    with open(USER_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def write_users(users: list[dict]):
    with open(USER_FILE, "w") as f:
        json.dump(users, f, indent=4)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


class RegisterRequest(BaseModel):
    organiser_id: int
    username: str
    password: str
    email: str
    mobile: str


class LoginRequest(BaseModel):
    organiser_id: int
    username: str
    password: str


class TeamSearchRequest(BaseModel):
    team_name: str


ALLOWED_ORGANISERS: list[dict[str, object]] = [
    # {"organiser_id": 142060, "username": "admin", "password": "s!xone"},
    # {"organiser_id": 16460, "username": "admin", "password": "s!xone"},
]


@app.post("/api/auth/register")
def register_user(payload: RegisterRequest):
    users = read_users()
    for u in users:
        if u["username"] == payload.username:
            raise HTTPException(status_code=400, detail="Username already exists")

    new_id = 1 if not users else max(u["id"] for u in users) + 1
    new_user = {
        "id": new_id,
        "organiser_id": payload.organiser_id,
        "username": payload.username,
        "password": hash_password(payload.password),
        "email": payload.email,
        "mobile": payload.mobile,
    }
    users.append(new_user)
    write_users(users)

    access_token = create_access_token(
        data={"sub": new_user["username"], "org": new_user["organiser_id"]}
    )

    return {
        "id": new_user["id"],
        "organiser_id": new_user["organiser_id"],
        "username": new_user["username"],
        "email": new_user["email"],
        "mobile": new_user["mobile"],
        "access_token": access_token,
    }


@app.post("/api/auth/login")
def login_user(payload: LoginRequest):
    users = read_users()
    user = next((u for u in users if u["organiser_id"] == payload.organiser_id and u["username"] == payload.username), None)
    
    is_valid = False
    if user is not None and verify_password(payload.password, user["password"]):
        is_valid = True
    else:
        # Fall back to legacy hard-coded combos for backward compatibility
        if any(
            payload.organiser_id == allowed["organiser_id"]
            and payload.username == allowed["username"]
            and payload.password == allowed["password"]
            for allowed in ALLOWED_ORGANISERS
        ):
            is_valid = True
            user = {"id": 0, "organiser_id": payload.organiser_id, "username": payload.username, "email": "", "mobile": ""}

    if not is_valid or user is None:
        raise HTTPException(status_code=401, detail="Invalid username, password, or organiser")

    access_token = create_access_token(data={"sub": user["username"], "org": user["organiser_id"]})

    return {
        "id": user["id"],
        "organiser_id": user["organiser_id"],
        "username": user["username"],
        "email": user["email"],
        "mobile": user["mobile"],
        "access_token": access_token,
    }

@app.get("/api/admin/organisers")
def list_organisers(current_user: dict = Depends(get_current_user)):
    # Restrict this endpoint to the admin user
    if current_user.get("sub") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    users = read_users()
    
    # Filter out passwords before returning the list for security
    safe_users = [{k: v for k, v in u.items() if k != "password"} for u in users]
    return safe_users

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/tournaments")
async def get_tournaments(
    current_user: dict = Depends(get_current_user),
    api_key: str | None = Header(default=None, alias="api-key"),
    device_type: str | None = Header(default=None, alias="device-type"),
    udid: str | None = Header(default=None, alias="udid"),
):
    organiser_id = current_user["org"]
    url = (
        "https://api.cricheroes.in/api/v1/organizer/"
        f"get-tournament-organizer-tournaments/{organiser_id}"
        "?pagesize=50&pageno=1"
    )
    params = {"pageno": 1, "pagesize": 50}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                url,
                params=params,
                headers=_upstream_headers(api_key, device_type, udid),
            )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Upstream request failed: {exc}") from exc

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream API returned status {response.status_code}",
        )

    data = response.json()

    # Try common container keys where the tournaments list might live
    tournaments = data.get("data") or data.get("tournaments") or data.get("items") or []

    if not isinstance(tournaments, list):
        raise HTTPException(status_code=502, detail="Unexpected upstream response format")

    result = []
    for item in tournaments:
        if not isinstance(item, dict):
            continue

        status = item.get("status")
        is_live = False
        if isinstance(status, str):
            is_live = status.strip().lower() in {
                "live"
            }
        elif isinstance(status, int):
            # Common convention: 1 = live/ongoing
            is_live = status == 1

        if not is_live:
            continue

        # Upstream shape: name in "name", id in "tournament_id"
        name = item.get("name") or item.get("tournament_name") or item.get("title")
        tournament_id = (
            item.get("tournament_id") or item.get("id") or item.get("tournamentId")
        )

        if name is not None and tournament_id is not None:
            result.append({"id": tournament_id, "name": name  })

    return sorted(result, key=lambda item: item["id"], reverse=True)


class TournamentMatchesRequest(BaseModel):
    tournamentid: int


def _extract_remaining_from_played_matches(
    tournamentid: int, played_matches: list[object], upcoming_matches: list[object] | None = None
):
    if not isinstance(played_matches, list):
        raise HTTPException(status_code=502, detail="Unexpected upstream response format")

    def extract_team_name(match: dict, side_keys: list[str]) -> str | None:
        for key in side_keys:
            value = match.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
            if isinstance(value, dict):
                nested_name = (
                    value.get("name") or value.get("team_name") or value.get("short_name")
                )
                if isinstance(nested_name, str) and nested_name.strip():
                    return nested_name.strip()
        return None

    def extract_team_id(match: dict, side_keys: list[str], id_keys: list[str]) -> object | None:
        for key in id_keys:
            value = match.get(key)
            if value is None or value == "":
                continue
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                return int(value) if float(value).is_integer() else value
            if isinstance(value, str) and value.strip():
                s = value.strip()
                if s.isdigit():
                    return int(s)
                return s
        for key in side_keys:
            value = match.get(key)
            if not isinstance(value, dict):
                continue
            nested_id = value.get("team_id") or value.get("id") or value.get("teamId")
            if nested_id is None or nested_id == "":
                continue
            if isinstance(nested_id, (int, float)) and not isinstance(nested_id, bool):
                return int(nested_id) if float(nested_id).is_integer() else nested_id
            if isinstance(nested_id, str) and nested_id.strip():
                s = nested_id.strip()
                if s.isdigit():
                    return int(s)
                return s
        return None

    teams: set[str] = set()
    played_pairs: set[frozenset[str]] = set()
    upcoming_pairs: set[frozenset[str]] = set()
    upcoming_match_details: dict[frozenset[str], dict] = {}

    team1_keys = ["team1_name", "team1", "home_team", "teamA", "team_a"]
    team2_keys = ["team2_name", "team2", "away_team", "teamB", "team_b"]
    team1_id_keys = ["team1_id", "home_team_id", "team_a_id", "teamAId", "homeTeamId"]
    team2_id_keys = ["team2_id", "away_team_id", "team_b_id", "teamBId", "awayTeamId"]

    name_to_id: dict[str, object] = {}

    for m in played_matches:
        if not isinstance(m, dict):
            continue

        team1 = extract_team_name(m, team1_keys)
        team2 = extract_team_name(m, team2_keys)

        if not team1 or not team2 or team1 == team2:
            continue

        tid1 = extract_team_id(m, team1_keys, team1_id_keys)
        tid2 = extract_team_id(m, team2_keys, team2_id_keys)
        if tid1 is not None:
            name_to_id[team1] = tid1
        if tid2 is not None:
            name_to_id[team2] = tid2

        teams.add(team1)
        teams.add(team2)
        played_pairs.add(frozenset({team1, team2}))

    if upcoming_matches is not None:
        if not isinstance(upcoming_matches, list):
            raise HTTPException(status_code=502, detail="Unexpected upstream response format")

        for m in upcoming_matches:
            if not isinstance(m, dict):
                continue

            team1 = extract_team_name(m, team1_keys)
            team2 = extract_team_name(m, team2_keys)

            if not team1 or not team2 or team1 == team2:
                continue

            tid1 = extract_team_id(m, team1_keys, team1_id_keys)
            tid2 = extract_team_id(m, team2_keys, team2_id_keys)
            if tid1 is not None:
                name_to_id[team1] = tid1
            if tid2 is not None:
                name_to_id[team2] = tid2

            teams.add(team1)
            teams.add(team2)
            pair = frozenset({team1, team2})
            upcoming_pairs.add(pair)
            upcoming_match_details[pair] = m

    all_pairs: set[frozenset[str]] = set()
    for a, b in itertools.combinations(sorted(teams), 2):
        all_pairs.add(frozenset({a, b}))

    remaining_pairs = all_pairs - played_pairs

    remaining_fixtures: list[dict[str, str]] = []
    for pair in sorted(remaining_pairs, key=lambda p: tuple(sorted(p))):
        t1, t2 = sorted(pair)
        remaining_fixtures.append({"team1": t1, "team2": t2})

    team_opponents: dict[str, list[dict[str, object]]] = {}
    for team in sorted(teams):
        team_opponents[team] = []

    for f in remaining_fixtures:
        pair = frozenset({f["team1"], f["team2"]})
        is_upcoming = pair in upcoming_pairs
        match_details = upcoming_match_details.get(pair, {})

        date_str = match_details.get("date") or match_details.get("match_date")
        time_str = match_details.get("time") or match_details.get("match_time")
        datetime_str = match_details.get("datetime") or match_details.get("match_datetime")
        match_start_time = match_details.get("match_start_time")

        team_opponents.setdefault(f["team1"], []).append(
            {
                "name": f["team2"],
                "id": name_to_id.get(f["team2"]),
                "upcoming": is_upcoming,
                "date": date_str,
                "time": time_str,
                "datetime": datetime_str,
                "match_start_time": match_start_time,
            }
        )
        team_opponents.setdefault(f["team2"], []).append(
            {
                "name": f["team1"],
                "id": name_to_id.get(f["team1"]),
                "upcoming": is_upcoming,
                "date": date_str,
                "time": time_str,
                "datetime": datetime_str,
                "match_start_time": match_start_time,
            }
        )

    for team, opponents in team_opponents.items():
        dedup: dict[str, dict[str, object]] = {}
        for opp in opponents:
            name = opp.get("name")
            if not isinstance(name, str):
                continue
            existing = dedup.get(name)
            if existing is None:
                dedup[name] = opp
            else:
                # If any fixture between this pair is upcoming, keep upcoming=True
                if opp.get("upcoming") or existing.get("upcoming"):
                    existing["upcoming"] = True
                    if not existing.get("date") and opp.get("date"):
                        existing["date"] = opp.get("date")
                    if not existing.get("time") and opp.get("time"):
                        existing["time"] = opp.get("time")
                    if not existing.get("datetime") and opp.get("datetime"):
                        existing["datetime"] = opp.get("datetime")
                    if not existing.get("match_start_time") and opp.get("match_start_time"):
                        existing["match_start_time"] = opp.get("match_start_time")
                if existing.get("id") is None and opp.get("id") is not None:
                    existing["id"] = opp["id"]
        team_opponents[team] = sorted(
            dedup.values(), key=lambda x: str(x.get("name") or "")
        )

    return {
        "tournamentid": tournamentid,
        "teams": sorted(teams),
        "played_match_count": len(played_pairs),
        "remaining_fixtures": remaining_fixtures,
        "team_opponents": team_opponents,
    }


@app.post("/api/tournament-matches")
async def get_tournament_matches(
    payload: TournamentMatchesRequest,
    api_key: str | None = Header(default=None, alias="api-key"),
    device_type: str | None = Header(default=None, alias="device-type"),
    udid: str | None = Header(default=None, alias="udid"),
):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            url = "https://api.cricheroes.in/api/v1/match/get-tournament-matches/3/-1/-1"
            base_params = {
                "tournamentid": payload.tournamentid,
                "pagesize": 100,
                "pageno": 1
            }

            # 3 = played/completed, 2 = upcoming
            played_response = await client.get(
                url,
                params={**base_params, "status": 3},
                headers=_upstream_headers(api_key, device_type, udid),
            )
            upcoming_response = await client.get(
                url,
                params={**base_params, "status": 2},
                headers=_upstream_headers(api_key, device_type, udid),
            )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Upstream request failed: {exc}") from exc

    if played_response.status_code != 200 or upcoming_response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Upstream API returned status "
                f"played={played_response.status_code}, upcoming={upcoming_response.status_code}"
            ),
        )

    played_data = played_response.json()
    upcoming_data = upcoming_response.json()
    played_matches = (
        played_data.get("data") or played_data.get("matches") or played_data.get("items") or []
    )
    upcoming_matches = (
        upcoming_data.get("data") or upcoming_data.get("matches") or upcoming_data.get("items") or []
    )

    return _extract_remaining_from_played_matches(
        payload.tournamentid, played_matches, upcoming_matches
    )


@app.get("/api/tournaments/{tournamentid}/remaining-fixtures")
async def get_remaining_fixtures(
    tournamentid: int,
    api_key: str | None = Header(default=None, alias="api-key"),
    device_type: str | None = Header(default=None, alias="device-type"),
    udid: str | None = Header(default=None, alias="udid"),
):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            url = "https://api.cricheroes.in/api/v1/match/get-tournament-matches/3/-1/-1"
            base_params = {
                "tournamentid": tournamentid,
                "pagesize": 100,
                "pageno": 1
            }

            # 3 = played/completed, 2 = upcoming
            played_response = await client.get(
                url,
                params={**base_params, "status": 3},
                headers=_upstream_headers(api_key, device_type, udid),
            )
            upcoming_response = await client.get(
                url,
                params={**base_params, "status": 2},
                headers=_upstream_headers(api_key, device_type, udid),
            )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Upstream request failed: {exc}") from exc

    if played_response.status_code != 200 or upcoming_response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Upstream API returned status "
                f"played={played_response.status_code}, upcoming={upcoming_response.status_code}"
            ),
        )

    played_data = played_response.json()
    upcoming_data = upcoming_response.json()

    played_matches = (
        played_data.get("data") or played_data.get("matches") or played_data.get("items") or []
    )
    upcoming_matches = (
        upcoming_data.get("data") or upcoming_data.get("matches") or upcoming_data.get("items") or []
    )

    extracted = _extract_remaining_from_played_matches(
        tournamentid, played_matches, upcoming_matches
    )

    # Separate route: return only remaining fixtures + team-wise opponents
    return {
        "tournamentid": tournamentid,
        "remaining_fixtures": extracted["remaining_fixtures"],
        "team_opponents": extracted["team_opponents"],
    }


@app.post("/api/search-team")
async def search_team(
    payload: TeamSearchRequest,
    current_user: dict = Depends(get_current_user),
    api_key: str | None = Header(default=None, alias="api-key"),
    device_type: str | None = Header(default=None, alias="device-type"),
    udid: str | None = Header(default=None, alias="udid"),
):
    organiser_id = current_user["org"]
    # 1. Fetch live tournaments
    url = (
        "https://api.cricheroes.in/api/v1/organizer/"
        f"get-tournament-organizer-tournaments/{organiser_id}"
        "?pagesize=50&pageno=1"
    )
    headers = _upstream_headers(api_key, device_type, udid)

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Upstream request failed: {exc}") from exc

        data = response.json()
        tournaments = data.get("data") or data.get("tournaments") or data.get("items") or []

        live_tournaments = []
        for item in tournaments:
            if not isinstance(item, dict): continue
            status = item.get("status")
            is_live = False
            if isinstance(status, str):
                is_live = status.strip().lower() in {"live"}
            elif isinstance(status, int):
                is_live = status == 1

            if is_live:
                t_id = item.get("tournament_id") or item.get("id") or item.get("tournamentId")
                t_name = item.get("name") or item.get("tournament_name") or item.get("title")
                if t_id and t_name:
                    live_tournaments.append({"id": t_id, "name": t_name})

        search_query = payload.team_name.lower()
        matching_results = []

        async def check_tournament(t):
            match_url = "https://api.cricheroes.in/api/v1/match/get-tournament-matches/3/-1/-1"
            try:
                played_resp, upcoming_resp = await asyncio.gather(
                    client.get(match_url, params={"tournamentid": t["id"], "pagesize": 100, "pageno": 1, "status": 3}, headers=headers),
                    client.get(match_url, params={"tournamentid": t["id"], "pagesize": 100, "pageno": 1, "status": 2}, headers=headers)
                )
                if played_resp.status_code == 200 and upcoming_resp.status_code == 200:
                    p_data = played_resp.json()
                    u_data = upcoming_resp.json()
                    p_matches = p_data.get("data") or p_data.get("matches") or p_data.get("items") or []
                    u_matches = u_data.get("data") or u_data.get("matches") or u_data.get("items") or []
                    extracted = _extract_remaining_from_played_matches(t["id"], p_matches, u_matches)
                    matched_teams = [team for team in extracted["teams"] if search_query in team.lower()]
                    if matched_teams:
                        return {"tournament": t, "matched_teams": matched_teams}
            except Exception:
                pass
            return None

        results = await asyncio.gather(*(check_tournament(t) for t in live_tournaments))
        for res in results:
            if res:
                matching_results.append(res)

        return {
            "team_search": payload.team_name,
            "results": matching_results
        }


# Serve built React frontend from ../frontend/dist if it exists
PROJECT_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount(
        "/",
        StaticFiles(directory=FRONTEND_DIST, html=True),
        name="frontend",
    )

    @app.exception_handler(StarletteHTTPException)
    async def spa_fallback_404_handler(
        request: Request, exc: StarletteHTTPException
    ):
        if exc.status_code == 404 and not request.url.path.startswith("/api"):
            index_file = FRONTEND_DIST / "index.html"
            if index_file.exists():
                return FileResponse(index_file)
        raise exc
