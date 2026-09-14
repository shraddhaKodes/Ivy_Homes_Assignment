import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { checkHealth } from "../services/api.js";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [health, setHealth] = useState({
    status: "checking",
    message: "Checking backend...",
  });

  useEffect(() => {
    let active = true;

    checkHealth()
      .then((payload) => {
        if (!active) return;

        setHealth({
          status: payload?.hasApiKey ? "online" : "warning",
          message: payload?.hasApiKey
            ? "Backend connected"
            : "Backend is running, but IVY_API_KEY is missing",
        });
      })
      .catch((error) => {
        if (!active) return;
        setHealth({ status: "offline", message: error.message });
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      await login({
        email: email.trim().replace("\\@", "@"),
        password: password.trim(),
      });
      navigate("/listings", { replace: true });
    } catch (error) {
      setMessage(error.message || "Unable to log in.");
    }
  }

  return (
    <main className="page login-page">
      <section className="login-card">
        <div className="login-brand">
          <span className="brand-mark">IH</span>
          <div>
            <h1>Ivy Homes</h1>
            <p>
              Sign in to view live listings, rentals, projects, and insights.
            </p>
          </div>
        </div>

        <div className={`connection-status ${health.status}`}>
          <span aria-hidden="true" />
          <div>
            <strong>{health.message}</strong>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field-label">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@example.com"
              autoComplete="off"
              required
            />
          </label>

          <label className="field-label">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete="off"
              required
            />
          </label>

          {message && <p className="form-error">{message}</p>}

          <button className="primary-button" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
