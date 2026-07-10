import React, { useState, useRef, useEffect } from "react";

function initials(name) {
  return (name || "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const ROLE_LABELS = { ADMIN: "Admin", BDM: "Business Development Manager", RECRUITER: "Recruiter" };

export default function ProfileMenu({ user, onLogout, dark }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        className="btn"
        style={{
          padding: 0, width: 34, height: 34, borderRadius: "50%", justifyContent: "center",
          background: dark ? "rgba(255,255,255,0.16)" : "var(--brand)",
          border: dark ? "1px solid rgba(255,255,255,0.24)" : "1px solid var(--brand)",
          color: "#fff",
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="mono" style={{ fontSize: 12 }}>{initials(user.name)}</span>
      </button>

      {open && (
        <div className="card" style={{ position: "absolute", right: 0, top: 42, width: 260, zIndex: 20, padding: 16 }}>
          <p className="serif" style={{ fontSize: 16, fontWeight: 600, margin: "0 0 2px" }}>{user.name}</p>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 10px" }}>{user.email}</p>
          <p className="mono" style={{ fontSize: 10.5, color: "var(--ink-soft)", margin: "0 0 14px" }}>{ROLE_LABELS[user.role] || user.role}</p>
          <button className="btn" style={{ width: "100%", justifyContent: "center" }} onClick={onLogout}>Log out</button>
        </div>
      )}
    </div>
  );
}
