import { useEffect, useState } from "react";
import { getAdminOrganisers, Organiser } from "./api";

export function AdminPage() {
  const [organisers, setOrganisers] = useState<Organiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getAdminOrganisers()
      .then((data) => {
        if (cancelled) return;
        setOrganisers(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="section">
      <div className="sectionHeader">
        <h1>Admin: Organisers</h1>
      </div>
      
      {error && <p className="error">Error: {error}</p>}
      
      {loading ? (
        <p className="muted">Loading organisers...</p>
      ) : organisers.length === 0 ? (
        <p className="muted">No organisers found.</p>
      ) : (
        <div className="sectionBody" style={{ overflowX: "auto" }}>
          <table className="list" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>ID</th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>Organiser ID</th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>Username</th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>Email</th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>Mobile</th>
              </tr>
            </thead>
            <tbody>
              {organisers.map((org) => (
                <tr key={org.id}>
                  <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{org.id}</td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{org.organiser_id}</td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{org.username}</td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{org.email}</td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{org.mobile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}