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
    <div className="card shadow-sm mt-4">
      <div className="card-header bg-white">
        <h1 className="h3 mb-0">Register</h1>
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
              Email
            </label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
          </div>
          <div className="mb-3">
            <label className="form-label">
              Mobile
            </label>
              <input
                className="form-control"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
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
              {submitting ? "Registering…" : "Register"}
            </button>
          </div>
          <div className="text-center">
            <button type="button" className="btn btn-link" onClick={onGoToLogin}>
              Already have an account? Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
