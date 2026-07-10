import React, { useState } from "react";
import { api, setSession } from "../api.js";
import Logo from "../components/Logo.jsx";

export default function Login({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      setSession(res.token, res.user);
      onLoggedIn(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        background: "linear-gradient(160deg, var(--brand) 0%, var(--brand-dark) 55%, #06232B 100%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Logo size={40} />
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ padding: 32 }}>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "0 0 24px", textAlign: "center", letterSpacing: "0.04em" }}>
            DIRECT-HIRE STAFFING
          </p>

          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@skillvanto.com"
            style={{ marginBottom: 14 }}
            required
          />

          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ marginBottom: 18 }}
            required
          />

          {error && <p className="error-text" style={{ marginBottom: 14 }}>{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "11px 14px", fontSize: 14 }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 18, textAlign: "center" }}>
            Ask your Admin for an account if you don't have one yet.
          </p>
        </form>
      </div>
    </div>
  );
}
