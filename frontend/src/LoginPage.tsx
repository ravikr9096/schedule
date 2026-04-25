import { FormEvent, useState, useEffect } from "react";
import { login, AuthUser, getStoredAuth } from "./api";

type LoginPageProps = {
  onLoginSuccess: (user: AuthUser, password: string) => void;
  onGoToRegister: () => void;
};

export function LoginPage({ onLoginSuccess, onGoToRegister }: LoginPageProps) {
  const [organisationIdInput, setOrganisationIdInput] = useState("142060");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth) {
      onLoginSuccess(auth.user, auth.password);
    }
  }, [onLoginSuccess]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const organisationId = Number(organisationIdInput);
    if (!Number.isFinite(organisationId) || organisationId <= 0) {
      setError("Please enter a valid organisation id");
      return;
    }

    if (!username.trim() || !password) {
      setError("Please enter username and password");
      return;
    }

    try {
      setSubmitting(true);
      const user = await login({
        organisation_id: organisationId,
        username: username.trim(),
        password,
      });
      onLoginSuccess(user, password);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Login failed. Please check your details.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="section">
      <div className="sectionHeader">
        <h1>Login</h1>
      </div>
      <form className="udidForm" onSubmit={onSubmit}>
        <div className="sectionBodyDetails">
          <div className="sectionBody">
            <label className="udidLabel">
              Organisation ID
              <input
                className="udidInput"
                value={organisationIdInput}
                onChange={(e) => setOrganisationIdInput(e.target.value)}
              />
            </label>
          </div>
          <div className="sectionBody">
            <label className="udidLabel">
              Username
              <input
                className="udidInput"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
          </div>
          <div className="sectionBody">
            <label className="udidLabel">
              Password
              <input
                type="password"
                className="udidInput"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>
          {error ? <p className="error">{error}</p> : null}
          <div className="sectionBody">
            <button className="toggleButton" type="submit" disabled={submitting}>
              {submitting ? "Logging in…" : "Log in"}
            </button>
          </div>
          <div className="sectionBody">
            <button
              type="button"
              className="linkButton"
              onClick={onGoToRegister}
            >
              Don&apos;t have an account? Register
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
