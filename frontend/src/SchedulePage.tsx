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
    <div className="container mt-4">
      <h1 className="mb-4">Tournaments</h1>

      {error ? <div className="alert alert-danger">Error: {error}</div> : null}

      {routeTournamentId == null ? (
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="card-title h4 mb-4">All tournaments</h2>

                <form
                  onSubmit={handleSearch}
              className="d-flex gap-2 mb-4"
                >
                  <input
                    type="text"
                className="form-control"
                    placeholder="Search by team name..."
                    value={teamSearchInput}
                    onChange={(e) => setTeamSearchInput(e.target.value)}
                  />
              <button className="btn btn-primary px-4" type="submit" disabled={loadingTournaments}>
                    Search
                  </button>
                  {teamSearchInput && (
                    <button
                  className="btn btn-outline-secondary"
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
            <p className="text-muted">Loading tournaments…</p>
          ) : tournaments.length === 0 ? (
            <p className="text-muted">No tournaments found.</p>
          ) : (
            <ul className="list-group">
              {tournaments.map((t) => (
                <li key={t.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <button
                    className="btn btn-link text-decoration-none p-0 text-start"
                    onClick={() => onSelectTournament(t)}
                  >
                    {t.name}
                  </button>
                  <span className="badge bg-secondary rounded-pill">#{t.id}</span>
                </li>
              ))}
            </ul>
          )}
          </div>
        </div>
      ) : (
        <div>
          <div className="d-flex align-items-center gap-3 mb-4">
            <button className="btn btn-outline-primary btn-sm" onClick={onBackToList}>
              Back
            </button>
            <h2 className="h4 mb-0">
              Remaining fixtures{" "}
              {selectedTournament ? (
                <span className="text-muted fs-6">({selectedTournament.name})</span>
              ) : null}
            </h2>
          </div>

          {loadingMatches ? (
            <p className="text-muted">Loading remaining fixtures…</p>
          ) : !teamOpponents ? (
            <p className="text-muted">No data.</p>
          ) : teamsSorted.length === 0 ? (
            <p className="text-muted">No remaining fixtures found.</p>
          ) : (
            <div className="row g-4">
              {teamsSorted.map((team) => (
                <div key={team} className="col-md-6 col-lg-4">
                  <div className="card h-100 shadow-sm border-0">
                    <div className="card-header bg-light border-bottom-0 pt-3 pb-2">
                      <h3 className="h6 mb-0 text-primary fw-bold">{team}</h3>
                    </div>
                    <ul className="list-group list-group-flush">
                    {teamOpponents[team].map((opp) => {
                      const label = opp.upcoming ? `${opp.name} (upcoming)` : opp.name;
                      const upcomingClass = opp.upcoming ? "bg-warning bg-opacity-10" : "";
                      const oppDetails = opp.id ? teamDetails[Number(opp.id)] : null;

                      return (
                        <li key={opp.name} className={`list-group-item d-flex flex-column gap-2 ${upcomingClass}`}>
                          <div className="d-flex justify-content-between align-items-center">
                            <a className="text-decoration-none fw-medium" target="_blank" rel="noopener noreferrer" href={`https://cricheroes.com/team-profile/${opp.id}/${ opp.name.replace(/\s+/g, '-').toLowerCase()}/matches`}>{label}</a>
                            {opp.id && (
                              <button
                                className="btn btn-sm btn-outline-secondary py-0 px-2 d-flex align-items-center gap-1"
                                style={{ fontSize: "0.75rem" }}
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
                          </div>
                          
                          {oppDetails && (
                            <div className="d-flex align-items-center gap-2" style={{ fontSize: "0.85rem" }}>
                                <span className="text-secondary">{oppDetails.name}</span>
                                <div className="ms-auto d-flex gap-2">
                                  <a className="text-decoration-none text-primary fw-medium" href={`tel:+91${oppDetails.mobile}`}>📞 Call</a>
                                  <span className="text-muted">|</span>
                                  <a className="text-decoration-none fw-medium" style={{ color: "#25D366" }} href={`https://wa.me/91${String(oppDetails.mobile).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
                                </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  </div>
                </div>
              ))}
            </div>
      )}

      {/* Popup for adding/editing team details */}
      {selectedTeamForDetails && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Details for {selectedTeamForDetails.teamName}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedTeamForDetails(null)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAddTeamDetails}>
                  <div className="mb-3">
                    <label className="form-label">Contact Name</label>
                    <input type="text" className="form-control" value={teamContactName} onChange={(e) => setTeamContactName(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mobile Number</label>
                    <input type="text" className="form-control" value={teamMobile} onChange={(e) => setTeamMobile(e.target.value)} required />
                  </div>
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button className="btn btn-outline-secondary" type="button" onClick={() => setSelectedTeamForDetails(null)}>Cancel</button>
                    <button className="btn btn-primary" type="submit" disabled={isSubmittingDetails}>
                      {isSubmittingDetails ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
    )}
        </div>
      )}
    </div>
  );
}
