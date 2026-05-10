import { FormEvent, useState, useEffect } from "react";
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
  const [teamDetails, setTeamDetails] = useState<Record<number, { name: string; mobile: string }>>({});
  const [selectedTeamForDetails, setSelectedTeamForDetails] = useState<{ id: number; teamName: string } | null>(null);
  const [teamContactName, setTeamContactName] = useState("");
  const [teamMobile, setTeamMobile] = useState("");
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);

  useEffect(() => {
    // Fetch existing team details to display them
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const detailsMap: Record<number, { name: string; mobile: string }> = {};
          data.forEach((d: any) => {
            detailsMap[d.team_id] = { name: d.name, mobile: d.mobile };
          });
          setTeamDetails(detailsMap);
        }
      })
      .catch((err) => console.error("Failed to fetch team details", err));
  }, []);

  async function handleAddTeamDetails(e: FormEvent) {
    e.preventDefault();
    if (!selectedTeamForDetails) return;

    setIsSubmittingDetails(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: selectedTeamForDetails.id,
          team_name: selectedTeamForDetails.teamName,
          name: teamContactName,
          mobile: teamMobile,
        }),
      });

      if (res.ok) {
        setTeamDetails((prev) => ({
          ...prev,
          [selectedTeamForDetails.id]: { name: teamContactName, mobile: teamMobile },
        }));
        setSelectedTeamForDetails(null);
        setTeamContactName("");
        setTeamMobile("");
      } else {
        console.error("Failed to save team details");
      }
    } catch (err) {
      console.error("Error saving team details", err);
    } finally {
      setIsSubmittingDetails(false);
    }
  }

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
                      const oppDetails = opp.id ? teamDetails[Number(opp.id)] : null;

                      return (
                        <li key={opp.name} className={`chip ${upcomingClass}`} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <a target="_blank" href={`https://cricheroes.com/team-profile/${opp.id}/${ opp.name.replace(/\s+/g, '-').toLowerCase()}/matches`}>{label}</a>
                          {oppDetails && (
                            <span style={{ fontSize: "0.85rem", color: "#555" }}>
                                ({oppDetails.name} - <a href={`tel:+91${oppDetails.mobile}`}>{oppDetails.mobile}</a>)
                            </span>
                          )}
                          {opp.id && (
                            <button
                              className="linkButton"
                              style={{ fontSize: "0.75rem", whiteSpace: "nowrap", padding: 0, display: "flex", alignItems: "center", gap: "0.25rem" }}
                              title={oppDetails ? "Edit Details" : "Add Details"}
                              onClick={() => {
                                setSelectedTeamForDetails({ id: Number(opp.id), teamName: opp.name });
                                setTeamContactName(oppDetails?.name || "");
                                setTeamMobile(oppDetails?.mobile || "");
                              }}
                            >
                              {oppDetails ? (
                                <>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                  Edit
                                </>
                              ) : (
                                <>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                  Add
                                </>
                              )}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
      )}

      {/* Popup for adding/editing team details */}
      {selectedTeamForDetails && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", 
          alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="card" style={{ padding: "2rem", width: "90%", maxWidth: "400px", background: "var(--surface, #fff)" }}>
            <h3 style={{ marginTop: 0 }}>Details for {selectedTeamForDetails.teamName}</h3>
            <form onSubmit={handleAddTeamDetails}>
              <div className="sectionBody" style={{ marginBottom: "1rem" }}>
                <label className="udidLabel">
                  Contact Name
                  <input type="text" className="udidInput" value={teamContactName} onChange={(e) => setTeamContactName(e.target.value)} required />
                </label>
              </div>
              <div className="sectionBody" style={{ marginBottom: "1rem" }}>
                <label className="udidLabel">
                  Mobile Number
                  <input type="text" className="udidInput" value={teamMobile} onChange={(e) => setTeamMobile(e.target.value)} required />
                </label>
              </div>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button className="linkButton" type="button" onClick={() => setSelectedTeamForDetails(null)}>Cancel</button>
                <button className="toggleButton" type="submit" disabled={isSubmittingDetails}>
                  {isSubmittingDetails ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
          )}
        </div>
      )}
    </>
  );
}
