import { FormEvent, useState } from "react";
import { Tournament, TeamOpponent } from "./api";

type SchedulePageProps = {
  error: string | null;
  tournaments: Tournament[];
  loadingTournaments: boolean;
  routeTournamentId: number | null;
  selectedTournament: Tournament | null;
  loadingMatches: boolean;
  teamsSorted: string[];
  teamOpponents: Record<string, TeamOpponent[]> | null;
  onSelectTournament: (t: Tournament) => void;
  onBackToList: () => void;
  onSearchTeam: (teamName: string) => void;
};

export function SchedulePage({
  error,
  tournaments,
  loadingTournaments,
  routeTournamentId,
  selectedTournament,
  loadingMatches,
  teamsSorted,
  teamOpponents,
  onSelectTournament,
  onBackToList,
  onSearchTeam,
}: SchedulePageProps) {
  const [teamSearchInput, setTeamSearchInput] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    onSearchTeam(teamSearchInput);
  }

  return (
    <>
      <h1>Tournaments</h1>

      {error ? <p className="error">Error: {error}</p> : null}

      {routeTournamentId == null ? (
        <div className="section">
          <h2>All tournaments</h2>

                <form
                  onSubmit={handleSearch}
                  style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
                >
                  <input
                    type="text"
                    className="udidInput"
                    style={{ flex: 1 }}
                    placeholder="Search by team name..."
                    value={teamSearchInput}
                    onChange={(e) => setTeamSearchInput(e.target.value)}
                  />
                  <button className="toggleButton" type="submit" disabled={loadingTournaments}>
                    Search
                  </button>
                  {teamSearchInput && (
                    <button
                      className="linkButton"
                      type="button"
                      onClick={() => {
                        setTeamSearchInput("");
                        onSearchTeam("");
                      }}
                    >
                      Clear
                    </button>
                  )}
                </form>

          {loadingTournaments ? (
            <p className="muted">Loading tournaments…</p>
          ) : tournaments.length === 0 ? (
            <p className="muted">No tournaments found.</p>
          ) : (
            <ul className="list">
              {tournaments.map((t) => (
                <li key={t.id} className="listItem">
                  <button
                    className="linkButton"
                    onClick={() => onSelectTournament(t)}
                  >
                    {t.name}
                  </button>
                  <span className="muted small">#{t.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="section">
          <div className="sectionHeader">
            <button className="toggleButton backButton" onClick={onBackToList}>
              Back
            </button>
            <h2>
              Remaining fixtures{" "}
              {selectedTournament ? (
                <span className="muted small">({selectedTournament.name})</span>
              ) : null}
            </h2>
          </div>

          {loadingMatches ? (
            <p className="muted">Loading remaining fixtures…</p>
          ) : !teamOpponents ? (
            <p className="muted">No data.</p>
          ) : teamsSorted.length === 0 ? (
            <p className="muted">No remaining fixtures found.</p>
          ) : (
            <div className="grid">
              {teamsSorted.map((team) => (
                <div key={team} className="teamCard">
                  <div className="teamName">{team}</div>
                  <ul className="chips">
                    {teamOpponents[team].map((opp) => {
                      const label = opp.upcoming ? `${opp.name} (upcoming)` : opp.name;
                      const upcomingClass = opp.upcoming ? "upcoming" : "";
                      return (
                        <li key={opp.name} className={`chip ${upcomingClass}`}>
                          <a target="_blank" href={`https://cricheroes.com/team-profile/${opp.id}/${ opp.name.replace(/\s+/g, '-').toLowerCase()}/matches`}>{label}</a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
