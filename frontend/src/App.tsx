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
  searchTeam,
} from "./api";
import { SchedulePage } from "./SchedulePage";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";
import { NavBar } from "./components/NavBar";

export default function App() {
  const [error, setError] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [udidInput, setUdidInput] = useState<string>(() => getUdid());
  const [udidVersion, setUdidVersion] = useState(0);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(
    null
  );
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [teamOpponents, setTeamOpponents] = useState<
    Record<string, TeamOpponent[]> | null
  >(null);
  const [routeView, setRouteView] = useState<
    | "login"
    | "register"
    | "schedule"
    | "introduction"
    | "about-us"
    | "legal"
    | "why-choose-us"
    | "what-sets-us-apart"
    | "clientele"
    | "gallery"
  >("introduction");
  const [routeTournamentId, setRouteTournamentId] = useState<number | null>(null);
  const [authSession, setAuthSession] = useState<{
    user: AuthUser;
    access_token: string;
  } | null>(() => getStoredAuth());

  const isAuthed = !!authSession;

  function syncRoute() {
    const path = window.location.pathname;
    const m = path.match(/^\/schedule\/(\d+)\/?$/);

    if (path === "/" || path === "") {
      setRouteView("login");
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
    } else if (path === "/introduction" || path === "/introduction/") {
      setRouteView("introduction");
      setRouteTournamentId(null);
    } else if (path === "/about-us" || path === "/about-us/") {
      setRouteView("about-us");
      setRouteTournamentId(null);
    } else if (path === "/legal" || path === "/legal/") {
      setRouteView("legal");
      setRouteTournamentId(null);
    } else if (path === "/why-choose-us" || path === "/why-choose-us/") {
      setRouteView("why-choose-us");
      setRouteTournamentId(null);
    } else if (path === "/what-sets-us-apart" || path === "/what-sets-us-apart/") {
      setRouteView("what-sets-us-apart");
      setRouteTournamentId(null);
    } else if (path === "/clientele" || path === "/clientele/") {
      setRouteView("clientele");
      setRouteTournamentId(null);
    } else if (path === "/gallery" || path === "/gallery/") {
      setRouteView("gallery");
      setRouteTournamentId(null);
    } else {
      setRouteView("introduction");
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

    if (teamSearchQuery.trim()) {
      searchTeam({
        team_name: teamSearchQuery.trim(),
      })
        .then((data: any) => {
          if (cancelled) return;
          setTournaments(data.results.map((r: any) => r.tournament));
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : String(e));
        })
        .finally(() => {
          if (cancelled) return;
          setLoadingTournaments(false);
        });
    } else {
      getTournaments()
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
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthed, authSession, teamSearchQuery]);

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

  function handleLoginSuccess(user: AuthUser) {
    const session = { user, access_token: user.access_token! };
    setAuthSession(session);
    setStoredAuth(session);
    navigate("/schedule");
  }

  function handleRegisterSuccess(user: AuthUser) {
    const session = { user, access_token: user.access_token! };
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
      <NavBar currentPath={routeView} onNavigate={navigate} />
      <div className="card">
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
              onSearchTeam={setTeamSearchQuery}
            />
          ) : (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onGoToRegister={() => navigate("/register")}
            />
          ))}
        {isAuthed && routeView !== "introduction" && (
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
