import { FormEvent, useState, useEffect } from "react";
import { login, AuthUser, getStoredAuth } from "./api";

type LoginPageProps = {
  onLoginSuccess: (user: AuthUser) => void;
  onGoToRegister: () => void;
};

export function LoginPage({ onLoginSuccess, onGoToRegister }: LoginPageProps) {
  const [organiserIdInput, setOrganiserIdInput] = useState("142060");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth) {
      onLoginSuccess(auth.user);
    }
  }, [onLoginSuccess]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const organiserId = Number(organiserIdInput);
    if (!Number.isFinite(organiserId) || organiserId <= 0) {
      setError("Please enter a valid organiser id");
      return;
    }

    if (!username.trim() || !password) {
      setError("Please enter username and password");
      return;
    }

    try {
      setSubmitting(true);
      const user = await login({
        organiser_id: organiserId,
        username: username.trim(),
        password,
      });
      onLoginSuccess(user);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Login failed. Please check your details.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card shadow-sm mt-4">
      <div className="card-header bg-white">
        <h1 className="h3 mb-0">Login</h1>
      </div>
      <div className="card-body">
        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label className="form-label">
              Organiser ID
            </label>
              <input
                className="form-control"
                value={organiserIdInput}
                onChange={(e) => setOrganiserIdInput(e.target.value)}
              />
          </div>
          <div className="mb-3">
            <label className="form-label">
              Username
            </label>
              <input
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
          </div>
          <div className="mb-3">
            <label className="form-label">
              Password
            </label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
          </div>
          {error ? <p className="text-danger">{error}</p> : null}
          <div className="d-grid mb-3">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Logging in…" : "Log in"}
            </button>
          </div>
          <div className="text-center">
            <button
              type="button"
              className="btn btn-link"
              onClick={onGoToRegister}
            >
              Don&apos;t have an account? Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
