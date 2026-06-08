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
    <div className="card shadow-lg border mt-4" style={{ backgroundColor: '#1a1d20', borderColor: '#fd7e14', color: '#fff' }}>
      <div className="card-header border-secondary">
        <h1 className="h3 mb-0 text-white">Admin: Organisers</h1>
      </div>
      
      <div className="card-body">
      {error && <div className="alert alert-danger">Error: {error}</div>}
      
      {loading ? (
        <p className="text-light">Loading organisers...</p>
      ) : organisers.length === 0 ? (
        <p className="text-light">No organisers found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-dark table-striped table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Organiser ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Mobile</th>
              </tr>
            </thead>
            <tbody>
              {organisers.map((org) => (
                <tr key={org.id}>
                  <td>{org.id}</td>
                  <td>{org.organiser_id}</td>
                  <td>{org.username}</td>
                  <td>{org.email}</td>
                  <td>{org.mobile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}