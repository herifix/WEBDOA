import { useState, type FormEvent } from "react";
import InstallHint from "../components/InstallHint";
import { login } from "../lib/auth";
import { navigate } from "../lib/router";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-brand">
        <div className="prayer-mark" aria-hidden="true">
          <svg viewBox="0 0 64 64">
            <path className="prayer-arc" d="M9 42a23 23 0 0 1 46 0" />
            <path d="M31.5 15.5c-4.8 5-7.4 10.8-7.7 17.1l-.3 7.2-8.4 9.1 10 9.1 6.9-11" />
            <path d="M32.5 15.5c4.8 5 7.4 10.8 7.7 17.1l.3 7.2 8.4 9.1-10 9.1-6.9-11" />
            <path d="M32 15.5v31.5" />
            <path d="M27.6 31.2c.8-6.4 2.3-11.6 4.4-15.7 2.1 4.1 3.6 9.3 4.4 15.7" />
            <path d="M24.2 40.6c3.7 2.7 6.3 5.9 7.8 9.5 1.5-3.6 4.1-6.8 7.8-9.5" />
          </svg>
        </div>
        <h1>DOA DONATUR</h1>
        <span />
        <p>Masuk untuk melihat jadwal doa</p>
      </div>

      <form className="login-card" onSubmit={handleSubmit}>
        <label>
          <span>Username</span>
          <span className="input-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              className="input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="Masukkan username"
            />
          </span>
        </label>

        <label>
          <span>Password</span>
          <span className="input-wrap has-action">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <input
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Masukkan password"
              type={showPassword ? "text" : "password"}
            />
            <button
              type="button"
              className="input-action"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </span>
        </label>

        <div
          className={`form-error ${error ? "is-visible" : ""}`}
          role={error ? "alert" : undefined}
          aria-live={error ? "polite" : undefined}
        >
          {error ? (
            <>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v6" />
                <path d="M12 17h.01" />
              </svg>
              <span>{error}</span>
            </>
          ) : null}
        </div>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Masuk..." : "Masuk"}
        </button>
      </form>

      <InstallHint />
    </main>
  );
}
