import { FormEvent, useState, useEffect, useMemo } from "react";
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
  const [viewMode, setViewMode] = useState<"grouped" | "list">("grouped");

  const uniqueMatches = useMemo(() => {
    const matches: any[] = [];
    if (teamOpponents) {
      teamsSorted.forEach((team) => {
        teamOpponents[team].forEach((opp) => {
          // To avoid duplicates, only add when team name is alphabetically before opponent name
          if (team < opp.name) {
            const team1Details = teamOpponents[opp.name]?.find((o) => o.name === team);
            matches.push({
              team1: team,
              team1Id: team1Details?.id,
              team2: opp.name,
              team2Id: opp.id,
              upcoming: opp.upcoming,
              date: (opp as any).date,
              time: (opp as any).time,
              datetime: (opp as any).datetime,
              match_date: (opp as any).match_date,
              match_time: (opp as any).match_time,
              match_datetime: (opp as any).match_datetime,
              match_start_time: (opp as any).match_start_time,
            });
          }
        });
      });
    }
    return matches;
  }, [teamOpponents, teamsSorted]);

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
            <h2 className="h4 mb-0 flex-grow-1">
              Remaining fixtures{" "}
              {selectedTournament ? (
                <span className="text-muted fs-6">({selectedTournament.name})</span>
              ) : null}
            </h2>
            {teamOpponents && (
              <div className="btn-group shadow-sm">
                <button
                  className={`btn btn-sm ${viewMode === "grouped" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setViewMode("grouped")}
                >
                  Grouped
                </button>
                <button
                  className={`btn btn-sm ${viewMode === "list" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setViewMode("list")}
                >
                  List
                </button>
              </div>
            )}
          </div>

          {loadingMatches ? (
            <p className="text-muted">Loading remaining fixtures…</p>
          ) : !teamOpponents ? (
            <p className="text-muted">No data.</p>
          ) : teamsSorted.length === 0 ? (
            <p className="text-muted">No remaining fixtures found.</p>
          ) : viewMode === "grouped" ? (
            <div className="row g-4">
              {teamsSorted.map((team) => (
                <div key={team} className="col-md-6 col-lg-4">
                  <div className="card h-100 shadow-sm border-0">
                    <div className="card-header bg-light border-bottom-0 pt-3 pb-2">
                      <h3 className="h6 mb-0 text-primary fw-bold">{team}</h3>
                    </div>
                    <ul className="list-group list-group-flush">
                    {teamOpponents[team].map((opp) => {
                    let label = opp.name;
                    if (opp.upcoming) {
                      const oppAny = opp as any; // Safe cast in case type isn't updated in api.ts
                      const dateStr = oppAny.date || oppAny.match_date;
                      const timeStr = oppAny.time || oppAny.match_time;
                      const datetime = oppAny.datetime || oppAny.match_datetime;
                      const matchStartTime = oppAny.match_start_time;
                      
                      let dateTimeLabel = "";
                      if (matchStartTime) {
                        let dt: Date;
                        if (typeof matchStartTime === "number") {
                          dt = new Date(matchStartTime > 1e11 ? matchStartTime : matchStartTime * 1000);
                        } else {
                          let ds = matchStartTime;
                          // Append 'Z' to treat as UTC if the time string does not include a timezone offset
                          if (typeof ds === "string" && !ds.includes("Z") && !ds.includes("+")) {
                            ds = ds.replace(" ", "T") + "Z";
                          }
                          dt = new Date(ds);
                        }
                        
                        if (!isNaN(dt.getTime())) {
                          dateTimeLabel = `: ${dt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}`;
                        } else {
                          dateTimeLabel = `: ${matchStartTime}`;
                        }
                      } else if (dateStr || timeStr) {
                        dateTimeLabel = `: ${[dateStr, timeStr].filter(Boolean).join(" ")}`;
                      } else if (datetime) {
                        const dt = new Date(datetime);
                        dateTimeLabel = !isNaN(dt.getTime()) ? `: ${dt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}` : `: ${datetime}`;
                      }
                      label = `${opp.name} (upcoming${dateTimeLabel})`;
                    }

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
          ) : (
            <div className="row g-4">
              {uniqueMatches.map((match, idx) => {
                const dateStr = match.date || match.match_date;
                const timeStr = match.time || match.match_time;
                const datetime = match.datetime || match.match_datetime;
                const matchStartTime = match.match_start_time;
                
                let dateTimeLabel = "";
                if (matchStartTime) {
                  let dt: Date;
                  if (typeof matchStartTime === "number") {
                    dt = new Date(matchStartTime > 1e11 ? matchStartTime : matchStartTime * 1000);
                  } else {
                    let ds = matchStartTime;
                    if (typeof ds === "string" && !ds.includes("Z") && !ds.includes("+")) {
                      ds = ds.replace(" ", "T") + "Z";
                    }
                    dt = new Date(ds);
                  }
                  
                  if (!isNaN(dt.getTime())) {
                    dateTimeLabel = dt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
                  } else {
                    dateTimeLabel = `${matchStartTime}`;
                  }
                } else if (dateStr || timeStr) {
                  dateTimeLabel = `${[dateStr, timeStr].filter(Boolean).join(" ")}`;
                } else if (datetime) {
                  const dt = new Date(datetime);
                  dateTimeLabel = !isNaN(dt.getTime()) ? dt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : `${datetime}`;
                }

                const upcomingClass = match.upcoming ? "bg-warning bg-opacity-10 border-warning" : "border-0";
                const team1Contact = match.team1Id ? teamDetails[Number(match.team1Id)] : null;
                const team2Contact = match.team2Id ? teamDetails[Number(match.team2Id)] : null;

                return (
                  <div key={idx} className="col-md-6 col-lg-4">
                    <div className={`card h-100 shadow-sm ${upcomingClass}`}>
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="card-title mb-0 text-primary text-truncate text-end" style={{flex: 1}} title={match.team1}>{match.team1}</h5>
                          <span className="badge bg-secondary mx-2">VS</span>
                          <h5 className="card-title mb-0 text-danger text-truncate text-start" style={{flex: 1}} title={match.team2}>{match.team2}</h5>
                        </div>
                        
                        <div className="text-center mb-3 flex-grow-1">
                          {match.upcoming ? (
                             <span className="badge bg-warning text-dark mb-2">Upcoming</span>
                          ) : (
                             <span className="badge bg-success mb-2">Remaining</span>
                          )}
                          {dateTimeLabel && <div className="text-muted small">🕒 {dateTimeLabel}</div>}
                        </div>

                        <hr className="my-2" />

                        <div className="d-flex justify-content-between align-items-start mt-2">
                          <div className="d-flex flex-column align-items-center" style={{flex: 1}}>
                            {match.team1Id ? (
                              <>
                                <a target="_blank" rel="noopener noreferrer" href={`https://cricheroes.com/team-profile/${match.team1Id}/${match.team1.replace(/\s+/g, '-').toLowerCase()}/matches`} className="text-decoration-none small mb-1">Profile</a>
                                {team1Contact ? (
                                  <div className="d-flex gap-2 align-items-center mt-1">
                                    <span className="text-secondary small fw-medium" title={team1Contact.name}>{team1Contact.name.split(' ')[0]}</span>
                                    <a className="text-decoration-none" title="Call" href={`tel:+91${team1Contact.mobile}`}>📞</a>
                                    <a className="text-decoration-none" title="WhatsApp" href={`https://wa.me/91${String(team1Contact.mobile).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">💬</a>
                                  </div>
                                ) : (
                                  <button className="btn btn-sm btn-link p-0 text-decoration-none" style={{fontSize: "0.75rem"}} onClick={() => {
                                    setSelectedTeamForDetails({ id: Number(match.team1Id), teamName: match.team1 });
                                    setTeamContactName("");
                                    setTeamMobile("");
                                  }}>Add Contact</button>
                                )}
                              </>
                            ) : <span className="text-muted small">No Profile</span>}
                          </div>

                          <div className="border-end h-100 mx-1"></div>

                          <div className="d-flex flex-column align-items-center" style={{flex: 1}}>
                            {match.team2Id ? (
                              <>
                                <a target="_blank" rel="noopener noreferrer" href={`https://cricheroes.com/team-profile/${match.team2Id}/${match.team2.replace(/\s+/g, '-').toLowerCase()}/matches`} className="text-decoration-none small mb-1">Profile</a>
                                {team2Contact ? (
                                  <div className="d-flex gap-2 align-items-center mt-1">
                                    <span className="text-secondary small fw-medium" title={team2Contact.name}>{team2Contact.name.split(' ')[0]}</span>
                                    <a className="text-decoration-none" title="Call" href={`tel:+91${team2Contact.mobile}`}>📞</a>
                                    <a className="text-decoration-none" title="WhatsApp" href={`https://wa.me/91${String(team2Contact.mobile).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">💬</a>
                                  </div>
                                ) : (
                                  <button className="btn btn-sm btn-link p-0 text-decoration-none" style={{fontSize: "0.75rem"}} onClick={() => {
                                    setSelectedTeamForDetails({ id: Number(match.team2Id), teamName: match.team2 });
                                    setTeamContactName("");
                                    setTeamMobile("");
                                  }}>Add Contact</button>
                                )}
                              </>
                            ) : <span className="text-muted small">No Profile</span>}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
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
