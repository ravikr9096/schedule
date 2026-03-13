import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getRemainingFixtures,
  getTournaments,
  getUdid,
  setUdid,
  Tournament,
  TeamOpponent,
  AuthUser,
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
} from "./api";
import { HomePage } from "./HomePage";
import { SchedulePage } from "./SchedulePage";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";

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
  const [routeView, setRouteView] = useState<
    "home" | "login" | "register" | "schedule"
  >("home");
  const [routeTournamentId, setRouteTournamentId] = useState<number | null>(null);
  const [authSession, setAuthSession] = useState<{
    user: AuthUser;
    password: string;
  } | null>(() => getStoredAuth());

  const isAuthed = !!authSession;

  function syncRoute() {
    const path = window.location.pathname;
    const m = path.match(/^\/schedule\/(\d+)\/?$/);

    if (path === "/" || path === "") {
      setRouteView("home");
      setRouteTournamentId(null);
    } else if (path === "/login" || path === "/login/") {
      setRouteView("login");
      setRouteTournamentId(null);
    } else if (path === "/register" || path === "/register/") {
      setRouteView("register");
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

  function navigate(path: string) {
    window.history.pushState({}, "", path);
    syncRoute();
  }

  useEffect(() => {
    if (!isAuthed || !authSession) {
      return;
    }

    let cancelled = false;
    setLoadingTournaments(true);
    setError(null);
    getTournaments({
      organizer_id: authSession.user.organisation_id,
      username: authSession.user.username,
      password: authSession.password,
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
  }, [isAuthed, authSession]);

  useEffect(() => {
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
    navigate(`/schedule/${t.id}`);
  }

  function onGoToSchedule() {
    if (isAuthed) {
      navigate("/schedule");
    } else {
      navigate("/login");
    }
  }

  function handleLoginSuccess(user: AuthUser, password: string) {
    const session = { user, password };
    setAuthSession(session);
    setStoredAuth(session);
    navigate("/schedule");
  }

  function handleRegisterSuccess(user: AuthUser, password: string) {
    const session = { user, password };
    setAuthSession(session);
    setStoredAuth(session);
    navigate("/schedule");
  }

  function handleLogout() {
    setAuthSession(null);
    clearStoredAuth();
    navigate("/");
  }

  return (
    <div className="page">
      <div className="card">
        {routeView === "home" && (
          <HomePage onGoToSchedule={onGoToSchedule} />
        )}
        {routeView === "login" && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onGoToRegister={() => navigate("/register")}
          />
        )}
        {routeView === "register" && (
          <RegisterPage
            onRegisterSuccess={handleRegisterSuccess}
            onGoToLogin={() => navigate("/login")}
          />
        )}
        {routeView === "schedule" &&
          (isAuthed ? (
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
                navigate("/schedule");
              }}
            />
          ) : (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onGoToRegister={() => navigate("/register")}
            />
          ))}
        {isAuthed && routeView !== "home" && (
          <div className="sectionBody" style={{ marginTop: "1rem" }}>
            <button className="toggleButton" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

