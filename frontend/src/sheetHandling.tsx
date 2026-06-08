import { useState, useEffect, useMemo, FormEvent } from "react";

type SheetMatch = {
  ground: string;
  slot: string;
  team_a: string;
  team_b: string;
};

const GROUND_COLORS = [
  { border: '#0d6efd', bg: 'rgba(13, 110, 253, 0.1)' }, // primary
  { border: '#198754', bg: 'rgba(25, 135, 84, 0.1)' }, // success
  { border: '#dc3545', bg: 'rgba(220, 53, 69, 0.1)' }, // danger
  { border: '#fd7e14', bg: 'rgba(253, 126, 20, 0.1)' }, // orange
  { border: '#0dcaf0', bg: 'rgba(13, 202, 240, 0.1)' }, // info
  { border: '#6610f2', bg: 'rgba(102, 16, 242, 0.1)' }, // purple
  { border: '#d63384', bg: 'rgba(214, 51, 132, 0.1)' }, // pink
  { border: '#20c997', bg: 'rgba(32, 201, 151, 0.1)' }, // teal
];

export function SheetHandling() {
  const [sheetData, setSheetData] = useState<Record<string, SheetMatch[]> | null>(null);
  const [sheetSlots, setSheetSlots] = useState<string[]>([]);
  const [sheetGrounds, setSheetGrounds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [isPageInitialized, setIsPageInitialized] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [modalDate, setModalDate] = useState("");
  const [modalSlot, setModalSlot] = useState("");
  const [formGround, setFormGround] = useState("");
  const [formTeamA, setFormTeamA] = useState("");
  const [formTeamB, setFormTeamB] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/gsheet").then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status} for /api/gsheet`);
        return res.json();
      }),
      fetch("/api/gsheet/meta").then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status} for /api/gsheet/meta`);
        return res.json();
      })
    ])
      .then(([data, meta]) => {
        setSheetData(data);
        setSheetSlots(meta.slots || []);
        setSheetGrounds(meta.grounds || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  const sheetDates = useMemo(() => {
    if (!sheetData) return [];
    
    const dates = Object.keys(sheetData);
    if (dates.length === 0) return [];

    const parsedDates = dates.map(d => ({ original: d, time: new Date(d).getTime() })).filter(d => !isNaN(d.time));
    
    if (parsedDates.length === 0) {
      return dates.sort();
    }

    parsedDates.sort((a, b) => a.time - b.time);
    
    const minDate = new Date(parsedDates[0].time);
    minDate.setHours(0, 0, 0, 0);
    const maxDate = new Date(parsedDates[parsedDates.length - 1].time);
    maxDate.setHours(0, 0, 0, 0);

    const timeMap = new Map<number, string>();
    parsedDates.forEach(d => {
      const t = new Date(d.time);
      t.setHours(0, 0, 0, 0);
      timeMap.set(t.getTime(), d.original);
    });

    const continuous: string[] = [];
    const curr = new Date(minDate);
    
    // Generate dates from min to max
    while (curr <= maxDate) {
      const t = curr.getTime();
      if (timeMap.has(t)) {
        continuous.push(timeMap.get(t)!);
      } else {
        const yyyy = curr.getFullYear();
        const mm = String(curr.getMonth() + 1).padStart(2, '0');
        const dd = String(curr.getDate()).padStart(2, '0');
        continuous.push(`${yyyy}-${mm}-${dd}`);
      }
      curr.setDate(curr.getDate() + 1);
    }
    
    // Ensure the length is a multiple of 7
    while (continuous.length % 7 !== 0) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      continuous.push(`${yyyy}-${mm}-${dd}`);
      curr.setDate(curr.getDate() + 1);
    }

    return continuous;
  }, [sheetData]);

  useEffect(() => {
    if (sheetDates.length > 0 && !isPageInitialized) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let foundIndex = -1;
      for (let i = 0; i < sheetDates.length; i++) {
        const d = new Date(sheetDates[i]);
        d.setHours(0, 0, 0, 0);
        if (d.getTime() >= today.getTime()) {
          foundIndex = i;
          break;
        }
      }
      
      const targetPage = foundIndex !== -1 ? Math.floor(foundIndex / 7) : Math.floor((sheetDates.length - 1) / 7);
      setPage(targetPage);
      setIsPageInitialized(true);
    }
  }, [sheetDates, isPageInitialized]);

  const visibleDates = useMemo(() => {
    const start = page * 7;
    return sheetDates.slice(start, start + 7);
  }, [sheetDates, page]);

  const getGroundColor = (ground: string) => {
    const normalized = ground.trim().toLowerCase();
    if (normalized === 'ground 1') return { border: '#20c997', bg: 'rgba(32, 201, 151, 0.15)' }; // teal
    if (normalized === 'ground 2') return { border: '#ffc107', bg: 'rgba(255, 193, 7, 0.15)' }; // yellowish

    const index = sheetGrounds.indexOf(ground);
    if (index === -1) return { border: '#6c757d', bg: 'rgba(108, 117, 125, 0.1)' }; // fallback
    return GROUND_COLORS[index % GROUND_COLORS.length];
  };

  const openAddModal = (date: string, slot: string) => {
    setModalDate(date);
    setModalSlot(slot);
    setFormGround("");
    setFormTeamA("");
    setFormTeamB("");
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (date: string, slot: string, ground: string, teamA: string, teamB: string) => {
    setModalDate(date);
    setModalSlot(slot);
    setFormGround(ground);
    setFormTeamA(teamA);
    setFormTeamB(teamB);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteMatch = async () => {
    if (!confirm(`Are you sure you want to delete the match at ${formGround}?`)) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/gsheet?date=${encodeURIComponent(modalDate)}&slot=${encodeURIComponent(modalSlot)}&ground=${encodeURIComponent(formGround)}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP error! status: ${res.status}`);
      }
      const newDataRes = await fetch("/api/gsheet");
      if (newDataRes.ok) setSheetData(await newDataRes.json());
      setIsModalOpen(false);
    } catch (err) {
      alert("Failed to delete match: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMatch = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        date: modalDate,
        slot: modalSlot,
        ground: formGround,
        team_a: formTeamA,
        team_b: formTeamB || "" // send empty string if omitted to clear adjacent cell
      };
      const res = await fetch("/api/gsheet", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP error! status: ${res.status}`);
      }
      
      // Refetch the sheet data to reflect the changes immediately
      const newDataRes = await fetch("/api/gsheet");
      if (newDataRes.ok) setSheetData(await newDataRes.json());
      setIsModalOpen(false);
    } catch (err) {
      alert(`Failed to ${isEditMode ? "edit" : "add"} match: ` + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.ceil(sheetDates.length / 7);

  if (loading) return <div className="container mt-4"><p className="text-light">Loading calendar...</p></div>;
  if (error) return <div className="container mt-4"><div className="alert alert-danger text-white" style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}>Error: {error}</div></div>;
  if (!sheetData || sheetDates.length === 0) return <div className="container mt-4"><p className="text-light">No calendar data found.</p></div>;

  return (
    <div className="container-fluid mt-4 text-white">
      <div className="d-flex justify-content-between align-items-center mb-4 text-white">
        <h1 className="mb-0 text-white">Match Calendar</h1>
        {totalPages > 1 && (
          <div className="btn-group shadow-sm">
            <button
              className="btn btn-outline-light"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              &laquo; Prev
            </button>
            <button
              className="btn btn-outline-light"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next &raquo;
            </button>
          </div>
        )}
      </div>
      <div className="table-responsive shadow-lg border rounded" style={{ maxHeight: '80vh', backgroundColor: '#1a1d20', borderColor: '#fd7e14' }}>
        <table className="table table-dark table-bordered table-sm mb-0" style={{ minWidth: '800px', tableLayout: 'fixed' }}>
          <thead className="text-center align-middle" style={{ position: 'sticky', top: 0, zIndex: 3 }}>
            <tr>
              <th style={{ width: '100px', position: 'sticky', left: 0, top: 0, zIndex: 4, backgroundColor: '#2b3035', color: '#fd7e14' }} className="border-end border-secondary shadow-sm py-2">Slot \ Date</th>
              {visibleDates.map(date => (
                <th key={date} style={{ minWidth: '160px', backgroundColor: '#2b3035', color: '#fd7e14' }} className="py-2 shadow-sm border-secondary">{date}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheetSlots.map(slot => (
              <tr key={slot}>
                <td className="align-middle fw-bold text-center border-end border-secondary" style={{ position: 'sticky', left: 0, zIndex: 2, backgroundColor: '#2b3035', color: '#fff' }}>{slot}</td>
                {visibleDates.map(date => {
                  const matches = sheetData[date]?.filter(m => m.slot === slot) || [];
                  return (
                    <td key={date} className="align-top p-1 border-secondary" style={{ verticalAlign: 'top', backgroundColor: '#1a1d20' }}>
                      {matches.length === 0 ? (
                        <div className="text-light small text-center py-1" style={{ opacity: 0.3 }}>-</div>
                      ) : (
                        matches.map((m, idx) => {
                          const colors = getGroundColor(m.ground);
                          return (
                          <div 
                            key={idx} 
                            className="card border mb-1 shadow-sm" 
                            style={{ borderLeft: `3px solid ${colors.border}`, backgroundColor: colors.bg, minHeight: 'auto', cursor: 'pointer' }}
                            onClick={() => openEditModal(date, slot, m.ground, m.team_a, m.team_b)}
                            title="Click to edit match"
                          >
                            <div className="card-header py-0 px-1 bg-transparent border-bottom-0 d-flex align-items-center" style={{ fontSize: '0.65rem', fontWeight: 600, color: colors.border }}>
                              <svg className="me-1" style={{ color: colors.border }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                              {m.ground}
                            </div>
                            <div className="card-body py-0 px-0 mb-0 text-center d-flex flex-column justify-content-center text-white">
                              <div className="fw-bold text-white text-break" style={{ fontSize: '0.75rem' }} title={m.team_a}>{m.team_a || 'TBA'}</div>
                              <div className="text-light my-0" style={{ fontSize: '0.6rem', fontWeight: 600 }}>VS</div>
                              <div className="fw-bold text-white text-break" style={{ fontSize: '0.75rem' }} title={m.team_b}>{m.team_b || 'TBA'}</div>
                            </div>
                          </div>
                          );
                        })
                      )}
                      <button 
                        className="btn btn-sm w-100 mt-1 p-0 text-light shadow-sm" 
                        style={{ fontSize: '0.7rem', borderStyle: 'dashed', borderWidth: '1px', backgroundColor: 'transparent', borderColor: '#6c757d' }}
                        onClick={() => openAddModal(date, slot)}
                      >
                        + Add Match
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Match Modal */}
      {isModalOpen && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1050 }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4" style={{ backgroundColor: '#1a1d20', borderColor: '#fd7e14' }}>
              <div className="modal-header border-bottom-0 bg-dark rounded-top-4 py-3">
                <h5 className="modal-title fw-bold text-white fs-5">{isEditMode ? "Edit Match" : "Add Match"}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsModalOpen(false)}></button>
              </div>
              <div className="modal-body pt-2 pb-4 text-white">
                <form onSubmit={handleAddMatch}>
                  <div className="row mb-2">
                    <div className="col-6">
                      <label className="form-label small mb-1 fw-bold text-light">Date</label>
                      <input type="text" className="form-control form-control-sm border-secondary text-white" style={{ backgroundColor: '#2b3035' }} value={modalDate} disabled />
                    </div>
                    <div className="col-6">
                      <label className="form-label small mb-1 fw-bold text-light">Slot</label>
                      <input type="text" className="form-control form-control-sm border-secondary text-white" style={{ backgroundColor: '#2b3035' }} value={modalSlot} disabled />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small mb-1 fw-bold text-light">Ground</label>
                    <select className="form-select form-select-sm border-secondary text-white" style={{ backgroundColor: '#2b3035' }} value={formGround} onChange={(e) => setFormGround(e.target.value)} required disabled={isEditMode}>
                      <option value="" disabled>Select Ground</option>
                      {sheetGrounds.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small mb-1 fw-bold text-light">Team A</label>
                    <input type="text" className="form-control form-control-sm border-secondary text-white" style={{ backgroundColor: '#2b3035' }} placeholder="Enter team name" value={formTeamA} onChange={(e) => setFormTeamA(e.target.value)} required />
                  </div>
                  <div className="mb-4">
                    <label className="form-label small mb-1 fw-bold text-light">Team B <span className="fw-normal text-secondary">(Optional)</span></label>
                    <input type="text" className="form-control form-control-sm border-secondary text-white" style={{ backgroundColor: '#2b3035' }} placeholder="Enter opponent team name" value={formTeamB} onChange={(e) => setFormTeamB(e.target.value)} />
                  </div>
                  <div className="d-flex justify-content-between mt-4">
                    <div>
                      {isEditMode && (
                        <button className="btn btn-sm btn-outline-danger px-3 rounded-pill" type="button" onClick={handleDeleteMatch} disabled={isSubmitting}>
                          Delete Match
                        </button>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-dark border px-3 rounded-pill" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                      <button className="btn btn-sm px-4 rounded-pill fw-bold" style={{ backgroundColor: '#fd7e14', borderColor: '#fd7e14', color: '#fff' }} type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Match"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}