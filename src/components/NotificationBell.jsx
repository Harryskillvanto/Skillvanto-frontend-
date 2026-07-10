import React, { useState, useEffect, useRef } from "react";
import { api } from "../api.js";
import { STAGE_LABELS } from "../stages.js";

export default function NotificationBell({ dark }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  async function refresh() {
    try {
      const [list, count] = await Promise.all([api.getNotifications(), api.getUnreadCount()]);
      setNotifications(list);
      setUnreadCount(count.count);
    } catch (e) {
      // silently ignore polling errors, e.g. server temporarily down
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((o) => !o);
    if (!open && unreadCount > 0) {
      await api.markAllRead();
      setUnreadCount(0);
      refresh();
    }
  }

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button className={`btn ${dark ? "topbar-icon-btn" : "btn-ghost"}`} style={{ position: "relative", padding: "8px 10px" }} onClick={handleOpen}>
        🔔
        {unreadCount > 0 && (
          <span
            className="mono"
            style={{
              position: "absolute", top: 2, right: 2, background: "#C24A1E", color: "#fff",
              fontSize: 9.5, borderRadius: 20, padding: "1px 5px", lineHeight: 1.4,
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="card" style={{ position: "absolute", right: 0, top: 44, width: 320, maxHeight: 400, overflowY: "auto", zIndex: 20, padding: 8 }}>
          <p className="label" style={{ padding: "4px 8px" }}>Notifications</p>
          {notifications.length === 0 && <p style={{ fontSize: 12.5, color: "var(--ink-soft)", padding: "8px" }}>Nothing yet.</p>}
          {notifications.map((n) => (
            <div key={n.id} style={{ padding: "8px", borderBottom: "1px solid var(--line)" }}>
              <p style={{ fontSize: 13, margin: 0 }}>{formatMessage(n)}</p>
              <p className="mono" style={{ fontSize: 10, color: "var(--ink-soft)", margin: "4px 0 0" }}>
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatMessage(n) {
  // Messages already come pre-formatted from the server; STAGE_LABELS is
  // here in case future notification types reference raw stage enum values.
  return n.message;
}
