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
    <div className="card shadow-sm mt-4">
      <div className="card-header bg-white">
        <h1 className="h3 mb-0">Admin: Organisers</h1>
      </div>
      
      <div className="card-body">
      {error && <div className="alert alert-danger">Error: {error}</div>}
      
      {loading ? (
        <p className="text-muted">Loading organisers...</p>
      ) : organisers.length === 0 ? (
        <p className="text-muted">No organisers found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-light">
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