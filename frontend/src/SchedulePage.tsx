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
    <div className="w-100">

      {error ? <div className="alert alert-danger">Error: {error}</div> : null}

      {routeTournamentId == null ? (
        <div className="card shadow-lg border-0 rounded-4" style={{ backgroundColor: '#1a1d20', borderColor: '#fd7e14' }}>
          <div className="card-body p-4">
            <h2 className="card-title h3 mb-4 fw-bold text-white">All Tournaments</h2>

                <form
                  onSubmit={handleSearch}
                  className="d-flex flex-column flex-sm-row gap-2 mb-4"
                >
                  <input
                    type="text"
                    className="form-control form-control-lg border-0 rounded-pill px-4 text-white"
                    style={{ backgroundColor: '#2b3035' }}
                    placeholder="Search by team name..."
                    value={teamSearchInput}
                    onChange={(e) => setTeamSearchInput(e.target.value)}
                  />
                  <div className="d-flex gap-2">
                    <button className="btn btn-lg px-4 rounded-pill fw-bold shadow-sm" style={{ backgroundColor: '#fd7e14', borderColor: '#fd7e14', color: '#fff' }} type="submit" disabled={loadingTournaments}>
                      Search
                    </button>
                    {teamSearchInput && (
                      <button
                        className="btn btn-dark border-secondary btn-lg px-4 rounded-pill text-light fw-bold shadow-sm"
                        type="button"
                        onClick={() => {
                          setTeamSearchInput("");
                          onSearchTeam("");
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </form>

          {loadingTournaments ? (
            <p className="text-light">Loading tournaments…</p>
          ) : tournaments.length === 0 ? (
            <p className="text-light">No tournaments found.</p>
          ) : (
            <div className="row g-3">
              {tournaments.map((t) => (
                <div className="col-12 col-md-6 col-lg-4" key={t.id}>
                  <div className="card h-100 border shadow-sm tournament-card" onClick={() => onSelectTournament(t)} style={{cursor: 'pointer', borderRadius: '12px', transition: 'transform 0.15s, box-shadow 0.15s', backgroundColor: '#2b3035', borderColor: '#fd7e14'}}>
                    <div className="card-body d-flex justify-content-between align-items-center">
                      <div className="fw-bold text-white pe-2">{t.name}</div>
                      <span className="badge bg-dark text-light border border-secondary rounded-pill">#{t.id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      ) : (
        <div>
          <div className="d-flex align-items-center gap-3 mb-4">
            <button className="btn btn-dark border-secondary shadow-sm btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', color: '#fd7e14' }} onClick={onBackToList} title="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <h2 className="h4 mb-0 flex-grow-1 fw-bold text-white">
              Remaining Fixtures{" "}
              {selectedTournament ? (
                <a
                  href={`https://cricheroes.com/tournament/${selectedTournament.id}/${selectedTournament.name.replace(/\s+/g, '-').toLowerCase()}/matches/live-matches`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fs-6 text-decoration-none ms-2"
                  style={{ color: '#fd7e14' }}
                >
                  ({selectedTournament.name})
                </a>
              ) : null}
            </h2>
            {teamOpponents && (
              <div className="btn-group shadow-sm rounded-pill p-1 border border-secondary" style={{ backgroundColor: '#2b3035' }}>
                <button
                  className={`btn btn-sm rounded-pill border-0 px-3 fw-medium ${viewMode === "grouped" ? "shadow-sm text-white" : "text-light bg-transparent"}`}
                  style={viewMode === "grouped" ? { backgroundColor: '#fd7e14' } : {}}
                  onClick={() => setViewMode("grouped")}
                >
                  Grouped
                </button>
                <button
                  className={`btn btn-sm rounded-pill border-0 px-3 fw-medium ${viewMode === "list" ? "shadow-sm text-white" : "text-light bg-transparent"}`}
                  style={viewMode === "list" ? { backgroundColor: '#fd7e14' } : {}}
                  onClick={() => setViewMode("list")}
                >
                  List
                </button>
              </div>
            )}
          </div>

          {loadingMatches ? (
            <p className="text-light">Loading remaining fixtures…</p>
          ) : !teamOpponents ? (
            <p className="text-light">No data.</p>
          ) : teamsSorted.length === 0 ? (
            <p className="text-light">No remaining fixtures found.</p>
          ) : viewMode === "grouped" ? (
            <div className="row g-3">
              {teamsSorted.map((team) => (
                <div key={team} className="col-md-6 col-lg-4">
                  <div className="card h-100 shadow-sm border rounded-4 overflow-hidden" style={{ backgroundColor: '#1a1d20', borderColor: '#fd7e14' }}>
                    <div className="card-header border-bottom pt-3 pb-2 px-3" style={{ backgroundColor: '#2b3035', borderColor: '#fd7e14' }}>
                      <h3 className="h6 mb-0 fw-bold" style={{ color: '#fd7e14' }}>{team}</h3>
                    </div>
                    <ul className="list-group list-group-flush bg-transparent">
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

                      const upcomingClass = opp.upcoming ? "bg-dark" : "";
                      const oppDetails = opp.id ? teamDetails[Number(opp.id)] : null;

                      return (
                        <li key={opp.name} className={`list-group-item border-0 border-bottom px-3 py-3 d-flex flex-column gap-2 ${upcomingClass}`} style={{ backgroundColor: 'transparent', borderColor: '#333' }}>
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <a className="text-decoration-none fw-bold text-white lh-sm" style={{fontSize: '0.9rem'}} target="_blank" rel="noopener noreferrer" href={`https://cricheroes.com/team-profile/${opp.id}/${ opp.name.replace(/\s+/g, '-').toLowerCase()}/matches`}>{label}</a>
                            {opp.id && (
                              <button
                                className="btn btn-sm btn-dark border-secondary rounded-pill py-1 px-2 d-flex align-items-center gap-1 flex-shrink-0 text-light"
                                style={{ fontSize: "0.7rem", fontWeight: 600 }}
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
                            <div className="d-flex align-items-center mt-1 p-2 rounded-3 border" style={{ fontSize: "0.8rem", backgroundColor: '#2b3035', borderColor: '#444' }}>
                                <span className="text-light fw-medium text-truncate me-2" title={oppDetails.name}>{oppDetails.name.split(' ')[0]}</span>
                                <div className="ms-auto d-flex gap-2 flex-shrink-0">
                                  <a className="text-decoration-none fw-bold px-2 py-1 rounded d-flex align-items-center gap-1" style={{ color: '#fff', backgroundColor: '#fd7e14' }} href={`tel:+91${oppDetails.mobile}`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                    Call
                                  </a>
                                  <a className="text-decoration-none fw-bold px-2 py-1 rounded d-flex align-items-center gap-1" style={{ color: "#fff", backgroundColor: "#25D366" }} href={`https://wa.me/91${String(oppDetails.mobile).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                    WhatsApp
                                  </a>
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
            <div className="row g-3">
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

                const upcomingClass = match.upcoming ? "bg-dark border-secondary" : "border-secondary";
                const team1Contact = match.team1Id ? teamDetails[Number(match.team1Id)] : null;
                const team2Contact = match.team2Id ? teamDetails[Number(match.team2Id)] : null;

                return (
                  <div key={idx} className="col-md-6 col-lg-4">
                    <div className={`card h-100 shadow-sm border rounded-4 ${upcomingClass}`} style={{ backgroundColor: '#1a1d20' }}>
                      <div className="card-body d-flex flex-column p-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="fw-bold text-white text-truncate text-end" style={{flex: 1, fontSize: '0.95rem'}} title={match.team1}>{match.team1}</div>
                          <div className="badge bg-dark text-light border-secondary border mx-2 px-2 py-1 rounded-pill" style={{ fontSize: '0.65rem' }}>VS</div>
                          <div className="fw-bold text-white text-truncate text-start" style={{flex: 1, fontSize: '0.95rem'}} title={match.team2}>{match.team2}</div>
                        </div>
                        
                        <div className="text-center mb-2 flex-grow-1">
                          {match.upcoming ? (
                             <span className="badge bg-warning text-dark mb-1 rounded-pill px-3" style={{ backgroundColor: '#fd7e14' }}>Upcoming</span>
                          ) : (
                             <span className="badge bg-success text-white mb-1 rounded-pill px-3">Remaining</span>
                          )}
                          {dateTimeLabel && <div className="text-light fw-medium" style={{fontSize: '0.75rem'}}>🕒 {dateTimeLabel}</div>}
                        </div>

                        <div className="rounded-3 border border-secondary p-2 mt-auto" style={{ backgroundColor: '#2b3035' }}>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex flex-column align-items-center" style={{flex: 1}}>
                            {match.team1Id ? (
                              <>
                                <a target="_blank" rel="noopener noreferrer" href={`https://cricheroes.com/team-profile/${match.team1Id}/${match.team1.replace(/\s+/g, '-').toLowerCase()}/matches`} className="text-decoration-none fw-bold mb-1 text-warning" style={{fontSize: '0.75rem', color: '#fd7e14' }}>Profile</a>
                                {team1Contact ? (
                                  <div className="d-flex gap-1 align-items-center justify-content-center">
                                    <a className="text-decoration-none rounded-circle d-flex align-items-center justify-content-center" style={{width: '24px', height: '24px', backgroundColor: '#fd7e14', color: '#fff'}} title={`Call ${team1Contact.name}`} href={`tel:+91${team1Contact.mobile}`}>📞</a>
                                    <a className="text-decoration-none rounded-circle d-flex align-items-center justify-content-center" style={{width: '24px', height: '24px', backgroundColor: '#E8F5E9'}} title={`WhatsApp ${team1Contact.name}`} href={`https://wa.me/91${String(team1Contact.mobile).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">💬</a>
                                  </div>
                                ) : (
                                  <button className="btn btn-sm btn-dark border-secondary rounded-pill px-2 py-0 text-light fw-medium" style={{fontSize: "0.65rem"}} onClick={() => {
                                    setSelectedTeamForDetails({ id: Number(match.team1Id), teamName: match.team1 });
                                    setTeamContactName("");
                                    setTeamMobile("");
                                  }}>Add Contact</button>
                                )}
                              </>
                            ) : <span className="text-secondary" style={{fontSize: '0.7rem'}}>No Profile</span>}
                          </div>

                          <div className="border-end h-100 mx-1"></div>

                            <div className="d-flex flex-column align-items-center" style={{flex: 1}}>
                            {match.team2Id ? (
                              <>
                                <a target="_blank" rel="noopener noreferrer" href={`https://cricheroes.com/team-profile/${match.team2Id}/${match.team2.replace(/\s+/g, '-').toLowerCase()}/matches`} className="text-decoration-none fw-bold mb-1 text-warning" style={{fontSize: '0.75rem', color: '#fd7e14'}}>Profile</a>
                                {team2Contact ? (
                                  <div className="d-flex gap-1 align-items-center justify-content-center">
                                    <a className="text-decoration-none rounded-circle d-flex align-items-center justify-content-center" style={{width: '24px', height: '24px', backgroundColor: '#fd7e14', color: '#fff'}} title={`Call ${team2Contact.name}`} href={`tel:+91${team2Contact.mobile}`}>📞</a>
                                    <a className="text-decoration-none rounded-circle d-flex align-items-center justify-content-center" style={{width: '24px', height: '24px', backgroundColor: '#E8F5E9'}} title={`WhatsApp ${team2Contact.name}`} href={`https://wa.me/91${String(team2Contact.mobile).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">💬</a>
                                  </div>
                                ) : (
                                  <button className="btn btn-sm btn-dark border-secondary rounded-pill px-2 py-0 text-light fw-medium" style={{fontSize: "0.65rem"}} onClick={() => {
                                    setSelectedTeamForDetails({ id: Number(match.team2Id), teamName: match.team2 });
                                    setTeamContactName("");
                                    setTeamMobile("");
                                  }}>Add Contact</button>
                                )}
                              </>
                            ) : <span className="text-secondary" style={{fontSize: '0.7rem'}}>No Profile</span>}
                          </div>
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
                <div className="modal-content border-0 shadow-lg rounded-4" style={{ backgroundColor: '#1a1d20', borderColor: '#fd7e14' }}>
                  <div className="modal-header border-bottom-0 rounded-top-4 py-3" style={{ backgroundColor: '#2b3035' }}>
                    <h5 className="modal-title fw-bold text-white fs-5">Details for {selectedTeamForDetails.teamName}</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedTeamForDetails(null)}></button>
              </div>
                  <div className="modal-body pt-2 pb-4 text-white">
                <form onSubmit={handleAddTeamDetails}>
                  <div className="mb-3">
                        <label className="form-label small mb-1 fw-bold text-light">Contact Name</label>
                        <input type="text" className="form-control form-control-sm border-secondary text-white" style={{ backgroundColor: '#2b3035' }} value={teamContactName} onChange={(e) => setTeamContactName(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                        <label className="form-label small mb-1 fw-bold text-light">Mobile Number</label>
                        <input type="text" className="form-control form-control-sm border-secondary text-white" style={{ backgroundColor: '#2b3035' }} value={teamMobile} onChange={(e) => setTeamMobile(e.target.value)} required />
                  </div>
                  <div className="d-flex justify-content-end gap-2 mt-4">
                        <button className="btn btn-sm btn-dark border-secondary px-3 rounded-pill" type="button" onClick={() => setSelectedTeamForDetails(null)}>Cancel</button>
                        <button className="btn btn-sm px-4 rounded-pill fw-bold" style={{ backgroundColor: '#fd7e14', borderColor: '#fd7e14', color: '#fff' }} type="submit" disabled={isSubmittingDetails}>
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
