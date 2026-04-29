import { FormEvent, useState } from "react";
import { register, AuthUser } from "./api";

type RegisterPageProps = {
  onRegisterSuccess: (user: AuthUser) => void;
  onGoToLogin: () => void;
};

export function RegisterPage({
  onRegisterSuccess,
  onGoToLogin,
}: RegisterPageProps) {
  const [organiserIdInput, setOrganiserIdInput] = useState("142060");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const organiserId = Number(organiserIdInput);
    if (!Number.isFinite(organiserId) || organiserId <= 0) {
      setError("Please enter a valid organiser id");
      return;
    }

    if (!username.trim() || !password || !email.trim() || !mobile.trim()) {
      setError("All fields are required");
      return;
    }

    try {
      setSubmitting(true);
      const user = await register({
        organiser_id: organiserId,
        username: username.trim(),
        password,
        email: email.trim(),
        mobile: mobile.trim(),
      });
      onRegisterSuccess(user);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Registration failed. Please check your details.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="section">
      <div className="sectionHeader">
        <h1>Register</h1>
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
              Email
              <input
                type="email"
                className="udidInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </div>
          <div className="sectionBody">
            <label className="udidLabel">
              Mobile
              <input
                className="udidInput"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
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
              {submitting ? "Registering…" : "Register"}
            </button>
          </div>
          <div className="sectionBody">
            <button type="button" className="linkButton" onClick={onGoToLogin}>
              Already have an account? Login
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
