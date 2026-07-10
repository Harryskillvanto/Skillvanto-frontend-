import React, { useState } from "react";
import { DOMAIN_LABELS, STATUS_LABELS, STAGE_LABELS } from "../stages.js";

const DOMAIN_TONE = {
  HEALTHCARE: { fg: "#1F5A4E", bg: "#DCEBE6", bd: "#9FC6BA" },
  LEGAL: { fg: "#463A6E", bg: "#E4E0F0", bd: "#B6A9D8" },
  OTHER: { fg: "#7A5A1E", bg: "#EFE3C7", bd: "#D2B876" },
};
const STATUS_TONE = {
  OPEN: { fg: "#1F5A4E", bg: "#DCEBE6" },
  ON_HOLD: { fg: "#7A5A1E", bg: "#EFE3C7" },
  CLOSED: { fg: "#8A3D1C", bg: "#F1DFD2" },
  CLOSED_WON: { fg: "#123A2C", bg: "#C9E3D5" },
};
const STAGE_TONE = {
  PROSPECT: { fg: "#56666D", bg: "#EEF0EC", bd: "#D6DEDA" },
  SCREENED: { fg: "#1F5A4E", bg: "#DCEBE6", bd: "#9FC6BA" },
  SUBMITTED_TO_BDM: { fg: "#2A4E6E", bg: "#DCE7F0", bd: "#9FB9CC" },
  SUBMITTED_TO_CLIENT: { fg: "#2A4E6E", bg: "#DCE7F0", bd: "#9FB9CC" },
  INTERVIEWED: { fg: "#1F5A4E", bg: "#DCEBE6", bd: "#9FC6BA" },
  OFFERED: { fg: "#7A5A1E", bg: "#EFE3C7", bd: "#D2B876" },
  PLACEMENT: { fg: "#123A2C", bg: "#C9E3D5", bd: "#7BB89A" },
  BDM_REJECTED: { fg: "#8A3D1C", bg: "#F1DFD2", bd: "#D89B72" },
  CLIENT_REJECTED: { fg: "#8A3D1C", bg: "#F1DFD2", bd: "#D89B72" },
  BACKED_OUT: { fg: "#8A3D1C", bg: "#F1DFD2", bd: "#D89B72" },
};

export function DomainBadge({ domain }) {
  const t = DOMAIN_TONE[domain] || DOMAIN_TONE.OTHER;
  return <span className="badge" style={{ background: t.bg, color: t.fg, border: `1px solid ${t.bd}` }}>{DOMAIN_LABELS[domain] || domain}</span>;
}
export function StatusPill({ status }) {
  const t = STATUS_TONE[status] || STATUS_TONE.OPEN;
  return <span className="badge" style={{ background: t.bg, color: t.fg }}>{STATUS_LABELS[status] || status}</span>;
}
export function StageBadge({ stage }) {
  const t = STAGE_TONE[stage] || STAGE_TONE.PROSPECT;
  return <span className="badge" style={{ background: t.bg, color: t.fg, border: `1px solid ${t.bd}` }}>{STAGE_LABELS[stage] || stage}</span>;
}

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <input
      className="input"
      style={{ flex: 1, minWidth: 200 }}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function EmptyState({ text }) {
  return (
    <div className="card" style={{ padding: "36px 20px", textAlign: "center", color: "var(--ink-soft)", marginBottom: 14 }}>
      <p style={{ margin: 0, fontSize: 13.5 }}>{text}</p>
    </div>
  );
}

export function FormHeader({ title, onCancel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <h3 className="serif" style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{title}</h3>
      <button className="btn btn-ghost" style={{ padding: 6 }} onClick={onCancel}>✕</button>
    </div>
  );
}

export function FormFooter({ onCancel, onSubmit, label, disabled, error }) {
  return (
    <div>
      {error && <p className="error-text" style={{ marginBottom: 10 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn" onClick={onCancel} type="button">Cancel</button>
        <button className="btn btn-primary" onClick={onSubmit} disabled={disabled} type="button">{label}</button>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ flex: 1 }}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export function NotesSection({ notes, onAdd, onDelete }) {
  const [text, setText] = useState("");
  return (
    <div>
      <h3 className="serif" style={{ fontSize: 15.5, fontWeight: 600, margin: "0 0 10px" }}>Notes</h3>
      <textarea
        className="textarea"
        rows={2}
        placeholder="Add a note..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      <button
        className="btn"
        style={{ marginBottom: 14 }}
        onClick={() => { if (text.trim()) { onAdd(text.trim()); setText(""); } }}
      >
        Add note
      </button>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {notes.length === 0 && <p style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>No notes yet.</p>}
        {notes.map((n) => (
          <div key={n.id} style={{ background: "#F6F7F3", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <p style={{ fontSize: 13, margin: 0, whiteSpace: "pre-wrap" }}>{n.text}</p>
              <button className="btn btn-ghost" style={{ padding: 2 }} onClick={() => onDelete(n.id)}>✕</button>
            </div>
            <p className="mono" style={{ fontSize: 10.5, color: "var(--ink-soft)", margin: "6px 0 0" }}>
              Added by {n.author?.name || "someone"} · {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
