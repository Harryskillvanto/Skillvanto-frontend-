import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { EmptyState, FormHeader, FormFooter, Field } from "./ui.jsx";

const ROLES = ["RECRUITER", "BDM", "ADMIN"];
const ROLE_LABELS = { RECRUITER: "Recruiter", BDM: "Business Development Manager", ADMIN: "Admin" };

export default function TeamTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setUsers(await api.listUsers());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function handleDeactivate(id) {
    await api.deactivateUser(id);
    load();
  }

  if (error) return <EmptyState text={`Couldn't load team: ${error}`} />;
  if (loading) return <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Loading...</p>;

  const grouped = ROLES.map((role) => ({ role, members: users.filter((u) => u.role === role) }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 className="serif" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Team</h2>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 0" }}>
            {users.length} account{users.length !== 1 ? "s" : ""} · Admin can create Recruiter, BDM, and Admin logins here
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add team member</button>
      </div>

      {grouped.map(({ role, members }) => (
        <div key={role} style={{ marginBottom: 24 }}>
          <p className="label" style={{ marginBottom: 10 }}>{ROLE_LABELS[role]} ({members.length})</p>
          {members.length === 0 && <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 8 }}>No {ROLE_LABELS[role].toLowerCase()} accounts yet.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map((u) => (
              <div key={u.id} className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0 }}>{u.name}</p>
                  <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "2px 0 0" }}>{u.email}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="badge" style={{ background: u.active ? "#DCEBE6" : "#F1DFD2", color: u.active ? "#1F5A4E" : "#9A3E1C" }}>
                    {u.active ? "Active" : "Deactivated"}
                  </span>
                  {u.active && (
                    <button className="btn btn-ghost" onClick={() => handleDeactivate(u.id)}>Deactivate</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showForm && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <AddTeamMemberForm onCancel={() => setShowForm(false)} onCreated={() => { setShowForm(false); load(); }} />
        </div>
      )}
    </div>
  );
}

function AddTeamMemberForm({ onCancel, onCreated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("RECRUITER");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim() || !email.trim() || !password) return;
    setSaving(true);
    setError("");
    try {
      await api.createUser({ name: name.trim(), email: email.trim(), password, role });
      onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ width: 420, padding: 22, background: "#fff" }}>
      <FormHeader title="Add team member" onCancel={onCancel} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        <Field label="Full name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Recruiter" /></Field>
        <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@skillvanto.com" /></Field>
        <Field label="Temporary password">
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="They can use this to log in" />
        </Field>
        <Field label="Role">
          <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </Field>
      </div>
      <FormFooter onCancel={onCancel} onSubmit={submit} label={saving ? "Creating..." : "Create account"} disabled={saving} error={error} />
    </div>
  );
}
