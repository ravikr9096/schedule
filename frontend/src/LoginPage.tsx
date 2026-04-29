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
    <div className="section">
      <div className="sectionHeader">
        <h1>Login</h1>
      </div>
      <form className="udidForm" onSubmit={onSubmit}>
        <div className="sectionBodyDetails">
          <div className="sectionBody">
            <label className="udidLabel">
              Organiser ID
              <input
                className="udidInput"
                value={organiserIdInput}
                onChange={(e) => setOrganiserIdInput(e.target.value)}
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
