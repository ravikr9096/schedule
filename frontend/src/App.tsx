import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getRemainingFixtures,
  getTournaments,
  getUdid,
  setUdid,
  Tournament,
  TeamOpponent,
} from "./api";
import { HomePage } from "./HomePage";
import { SchedulePage } from "./SchedulePage";

export default function App() {
  const [error, setError] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [udidInput, setUdidInput] = useState<string>(() => getUdid());
  const [udidVersion, setUdidVersion] = useState(0);

  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(
    null
  );
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [teamOpponents, setTeamOpponents] = useState<
    Record<string, TeamOpponent[]> | null
  >(null);
  const [routeView, setRouteView] = useState<"home" | "schedule">("home");
  const [routeTournamentId, setRouteTournamentId] = useState<number | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [authUser, setAuthUser] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authOrganizerIdInput, setAuthOrganizerIdInput] = useState("142060");
  const [authOrganizerId, setAuthOrganizerId] = useState<number | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthed || authOrganizerId == null) {
      return;
    }

    let cancelled = false;
    setLoadingTournaments(true);
    setError(null);
    getTournaments({
      organizer_id: authOrganizerId,
      username: authUser,
      password: authPass,
    })
      .then((data) => {
        if (cancelled) return;
        setTournaments(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingTournaments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthed, authOrganizerId, authUser, authPass]);

  useEffect(() => {
    function syncRoute() {
      const path = window.location.pathname;
      const m = path.match(/^\/schedule\/(\d+)\/?$/);

      if (path === "/" || path === "") {
        setRouteView("home");
        setRouteTournamentId(null);
      } else if (path === "/schedule" || path === "/schedule/") {
        setRouteView("schedule");
        setRouteTournamentId(null);
      } else if (m) {
        setRouteView("schedule");
        setRouteTournamentId(Number(m[1]));
      } else {
        setRouteView("home");
        setRouteTournamentId(null);
      }
    }

    syncRoute();
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    if (routeTournamentId == null) {
      setSelectedTournament(null);
      setTeamOpponents(null);
      setLoadingMatches(false);
      return;
    }

    const t = tournaments.find((x) => x.id === routeTournamentId) ?? null;
    setSelectedTournament(t);

    setLoadingMatches(true);
    setError(null);
    setTeamOpponents(null);

    let cancelled = false;
    getRemainingFixtures(routeTournamentId)
      .then((data) => {
        if (cancelled) return;
        setTeamOpponents(data.team_opponents);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingMatches(false);
      });

    return () => {
      cancelled = true;
    };
  }, [routeTournamentId, tournaments, udidVersion]);

  function onSaveUdid(e: FormEvent) {
    e.preventDefault();
    setUdid(udidInput);
    setUdidVersion((v) => v + 1);
  }

  const teamsSorted = useMemo(() => {
    if (!teamOpponents) return [];
    return Object.keys(teamOpponents).sort((a, b) => a.localeCompare(b));
  }, [teamOpponents]);

  function onSelectTournament(t: Tournament) {
    window.history.pushState({}, "", `/schedule/${t.id}`);
    setRouteView("schedule");
    setRouteTournamentId(t.id);
  }

  function onGoToSchedule() {
    window.history.pushState({}, "", `/schedule`);
    setRouteView("schedule");
    setRouteTournamentId(null);
  }

  const AUTH_USER = "admin";
  const AUTH_PASS = "s!xone";

  function onSubmitAuth(e: FormEvent) {
    e.preventDefault();

    const organizerIdParsed = Number(authOrganizerIdInput);
    if (!Number.isFinite(organizerIdParsed) || organizerIdParsed <= 0) {
      setIsAuthed(false);
      setAuthError("Please enter a valid organizer id");
      return;
    }

    if (authUser === AUTH_USER && authPass === AUTH_PASS) {
      setIsAuthed(true);
      setAuthOrganizerId(organizerIdParsed);
      setAuthError(null);
    } else {
      setIsAuthed(false);
      setAuthError("Invalid credentials");
    }
  }

  return (
    <div className="page">
      <div className="card">
        {routeView === "home" ? (
          <HomePage onGoToSchedule={onGoToSchedule} />
        ) : (
          <>
            {!isAuthed ? (
              <div className="section">
                <div className="sectionHeader">
                  <h1>Schedule Login</h1>
                </div>
                
                  <form className="udidForm" onSubmit={onSubmitAuth}>
                  <div className="sectionBodyDetails">
                    <div className="sectionBody">
                      <label className="udidLabel">
                        Username
                        <input
                          className="udidInput"
                          value={authUser}
                          onChange={(e) => setAuthUser(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="sectionBody">
                      <label className="udidLabel">
                        Password
                        <input
                          type="password"
                          className="udidInput"
                          value={authPass}
                          onChange={(e) => setAuthPass(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="sectionBody">
                      <label className="udidLabel">
                        Organizer ID
                        <input
                          className="udidInput"
                          value={authOrganizerIdInput}
                          onChange={(e) => setAuthOrganizerIdInput(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="sectionBody">
                      <button className="toggleButton" type="submit">
                        Log in
                      </button>
                    </div>
                    {authError ? <p className="error">{authError}</p> : null}
                    </div>
                  </form>
                
              </div>
            ) : (
              <SchedulePage
                error={error}
                tournaments={tournaments}
                loadingTournaments={loadingTournaments}
                routeTournamentId={routeTournamentId}
                selectedTournament={selectedTournament}
                loadingMatches={loadingMatches}
                teamsSorted={teamsSorted}
                teamOpponents={teamOpponents}
                onSelectTournament={onSelectTournament}
                onBackToList={() => {
                  window.history.pushState({}, "", `/schedule`);
                  setRouteView("schedule");
                  setRouteTournamentId(null);
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

