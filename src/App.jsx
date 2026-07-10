import React, { useState, useEffect } from "react";
import { api, getToken, getCurrentUser, setSession } from "./api.js";
import Login from "./pages/Login.jsx";
import ClientsTab from "./components/ClientsTab.jsx";
import JobsTab from "./components/JobsTab.jsx";
import CandidatesTab from "./components/CandidatesTab.jsx";
import SubmissionsTab from "./components/SubmissionsTab.jsx";
import TeamTab from "./components/TeamTab.jsx";
import NotificationBell from "./components/NotificationBell.jsx";
import ProfileMenu from "./components/ProfileMenu.jsx";
import Logo from "./components/Logo.jsx";
import GlobalSearch from "./components/GlobalSearch.jsx";

export default function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [checking, setChecking] = useState(!!getToken());
  const [tab, setTab] = useState("jobs");
  const [openJobId, setOpenJobId] = useState(null);
  const [openCandidateId, setOpenCandidateId] = useState(null);
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // On load, if we have a stored token, confirm it's still valid before
  // trusting the cached user (handles expired/old sessions cleanly).
  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((me) => setUser(me))
      .catch(() => setSession(null, null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (user) api.getClients().then(setClients).catch(() => setClients([]));
  }, [user]);

  function handleLogout() {
    setSession(null, null);
    setUser(null);
  }

  if (checking) {
    return <div style={{ padding: 40, fontSize: 13, color: "var(--ink-soft)" }}>Checking your session...</div>;
  }

  if (!user) {
    return <Login onLoggedIn={setUser} />;
  }

  return (
    <div>
      <div className="topbar" style={{ paddingBottom: 0 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "18px 24px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <Logo />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <NotificationBell dark />
              <ProfileMenu user={user} onLogout={handleLogout} dark />
            </div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <button className={`tab ${tab === "jobs" ? "active" : ""}`} onClick={() => { setTab("jobs"); setOpenJobId(null); }}>Job orders</button>
            <button className={`tab ${tab === "candidates" ? "active" : ""}`} onClick={() => setTab("candidates")}>Candidates</button>
            <button className={`tab ${tab === "clients" ? "active" : ""}`} onClick={() => setTab("clients")}>Clients</button>
            <button className={`tab ${tab === "submissions" ? "active" : ""}`} onClick={() => setTab("submissions")}>Submissions</button>
            {user.role === "ADMIN" && (
              <button className={`tab ${tab === "team" ? "active" : ""}`} onClick={() => setTab("team")}>Team</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 24px 60px" }}>
        <GlobalSearch query={searchQuery} setQuery={setSearchQuery} />
        {tab === "jobs" && <JobsTab user={user} clients={clients} openJobId={openJobId} setOpenJobId={setOpenJobId} q={searchQuery} setQ={setSearchQuery} />}
        {tab === "candidates" && <CandidatesTab openId={openCandidateId} setOpenId={setOpenCandidateId} q={searchQuery} setQ={setSearchQuery} />}
        {tab === "clients" && (
          <ClientsTab
            user={user}
            onOpenJob={(id) => { setTab("jobs"); setOpenJobId(id); }}
          />
        )}
        {tab === "submissions" && (
          <SubmissionsTab
            user={user}
            onOpenJob={(id) => { setTab("jobs"); setOpenJobId(id); }}
            onOpenCandidate={(id) => { setTab("candidates"); setOpenCandidateId(id); }}
          />
        )}
        {tab === "team" && user.role === "ADMIN" && <TeamTab />}
      </div>
    </div>
  );
}
