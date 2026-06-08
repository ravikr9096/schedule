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
import { AdminPage } from "./AdminPage";
import { MyMatchesPage } from "./MyMatchesPage";
import { SheetHandling } from "./sheetHandling";

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
    | "admin"
    | "admin-matches"
    | "sheet-handling"
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
    } else if (path === "/admin" || path === "/admin/" || path === "/admin/organisers" || path === "/admin/organisers/") {
      setRouteView("admin");
      setRouteTournamentId(null);
    } else if (path === "/admin/matches" || path === "/admin/matches/") {
      setRouteView("admin-matches");
      setRouteTournamentId(null);
    } else if (path === "/sheet-handling" || path === "/sheet-handling/") {
      setRouteView("sheet-handling");
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
    <div className="d-flex flex-column min-vh-100 pb-5" style={{ backgroundColor: '#121416', color: '#f8f9fa' }}>
      <style>{`
        .navbar {
          background-color: #1a1d20 !important;
          border-bottom: 1px solid #fd7e14 !important;
        }
        .navbar .navbar-brand, .navbar .nav-link, .navbar a {
          color: #f8f9fa !important;
          text-decoration: none !important;
        }
        .navbar .nav-link:hover, .navbar .nav-link.active, .navbar a:hover {
          color: #fd7e14 !important;
        }
        .navbar-toggler {
          border-color: rgba(253, 126, 20, 0.5) !important;
        }
        .navbar-toggler-icon {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='%23fd7e14' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e") !important;
        }
        .form-control:focus, .form-select:focus, .btn:focus, .navbar-toggler:focus {
          border-color: #fd7e14 !important;
          box-shadow: 0 0 0 0.25rem rgba(253, 126, 20, 0.25) !important;
        }
        ::placeholder {
          color: #adb5bd !important;
          opacity: 1 !important;
        }
      `}</style>
      <NavBar
        currentPath={routeView}
        onNavigate={navigate}
        isAdmin={isAuthed && authSession.user.username === "admin"}
      />
      <main className="container-fluid px-2 px-md-4 py-3 flex-grow-1 d-flex flex-column" style={{ maxWidth: '1400px' }}>
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
        {routeView === "admin" &&
          (isAuthed && authSession.user.username === "admin" ? (
            <AdminPage />
          ) : (
            <div className="section">
              <p className="alert alert-danger">You do not have permission to view this page.</p>
            </div>
          ))}
        {routeView === "admin-matches" &&
          (isAuthed && authSession.user.username === "admin" ? (
            <MyMatchesPage />
          ) : (
            <div className="section">
              <p className="alert alert-danger">You do not have permission to view this page.</p>
            </div>
          ))}
    {routeView === "sheet-handling" && (
      <SheetHandling />
    )}
        {isAuthed && routeView !== "introduction" && (
          <div className="mt-4 d-flex justify-content-center">
            <button className="btn btn-outline-danger" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
