import React, { useState, useEffect, useMemo } from "react";
import { api } from "../api.js";
import { DOMAINS, JOB_STATUSES, ALL_STAGES, STAGE_LABELS, DOMAIN_LABELS, STATUS_LABELS, stagesForRole } from "../stages.js";
import { DomainBadge, StatusPill, StageBadge, SearchBox, EmptyState, FormHeader, FormFooter, Field, NotesSection } from "./ui.jsx";

export default function JobsTab({ user, clients, openJobId, setOpenJobId, q, setQ }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [domainFilter, setDomainFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" = newest first, "asc" = oldest first
  const [showForm, setShowForm] = useState(false);

  const canManage = user.role === "ADMIN" || user.role === "BDM";

  async function load() {
    setLoading(true);
    setError("");
    try {
      setJobs(await api.getJobs());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const loc = locationFilter.trim().toLowerCase();
    const result = jobs.filter((j) => {
      if (q && !j.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (domainFilter !== "All" && j.domain !== domainFilter) return false;
      if (statusFilter !== "All" && j.status !== statusFilter) return false;
      if (loc && !(j.location || "").toLowerCase().includes(loc)) return false;
      if (dateFrom && new Date(j.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(j.createdAt) > new Date(`${dateTo}T23:59:59`)) return false;
      return true;
    });
    result.sort((a, b) => {
      const diff = new Date(a.createdAt) - new Date(b.createdAt);
      return sortOrder === "asc" ? diff : -diff;
    });
    return result;
  }, [jobs, q, domainFilter, statusFilter, locationFilter, dateFrom, dateTo, sortOrder]);

  if (openJobId) {
    return <JobDetail jobId={openJobId} user={user} onBack={() => { setOpenJobId(null); load(); }} />;
  }

  if (error) return <EmptyState text={`Couldn't load job orders: ${error}`} />;
  if (loading) return <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Loading...</p>;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <SearchBox value={q} onChange={setQ} placeholder="Search job titles" />
        <select className="select" style={{ width: 150 }} value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
          <option>All</option>
          {DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_LABELS[d]}</option>)}
        </select>
        <select className="select" style={{ width: 150 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All</option>
          {JOB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          className="input"
          style={{ width: 160 }}
          placeholder="Filter by location"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        />
        <select className="select" style={{ width: 150 }} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label className="label" style={{ marginBottom: 0, fontSize: 11 }}>From</label>
          <input type="date" className="input" style={{ width: 145 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <label className="label" style={{ marginBottom: 0, fontSize: 11 }}>To</label>
          <input type="date" className="input" style={{ width: 145 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          {(dateFrom || dateTo) && (
            <button className="btn btn-ghost" style={{ padding: "3px 8px" }} onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</button>
          )}
        </div>
        {canManage && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New job order</button>}
      </div>

      {filtered.length === 0 && <EmptyState text="No job orders match." />}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((j) => (
          <div key={j.id} className="card" style={{ padding: 15, cursor: "pointer" }} onClick={() => setOpenJobId(j.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 className="serif" style={{ fontSize: 15.5, fontWeight: 600, margin: 0 }}>{j.title}</h3>
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "3px 0 0" }}>
                  {j.client?.name || "No client"} {j.location ? `· ${j.location}` : ""}
                  {j.assignedRecruiter ? ` · Assigned to ${j.assignedRecruiter.name}` : ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <DomainBadge domain={j.domain} />
                <StatusPill status={j.status} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <JobForm clients={clients} onCancel={() => setShowForm(false)} onCreated={() => { setShowForm(false); load(); }} />
        </div>
      )}
    </div>
  );
}

function JobForm({ clients, initial, onCancel, onCreated }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [clientId, setClientId] = useState(initial?.clientId || clients[0]?.id || "");
  const [domain, setDomain] = useState(initial?.domain || "HEALTHCARE");
  const [location, setLocation] = useState(initial?.location || "");
  const [salaryMin, setSalaryMin] = useState(initial?.salaryMin || "");
  const [salaryMax, setSalaryMax] = useState(initial?.salaryMax || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [postingUrl, setPostingUrl] = useState(initial?.postingUrl || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim() || !clientId) return;
    setSaving(true);
    setError("");
    const data = { title: title.trim(), domain, location, salaryMin: salaryMin || undefined, salaryMax: salaryMax || undefined, description, postingUrl };
    try {
      if (initial) {
        await api.updateJob(initial.id, data);
      } else {
        await api.createJob({ ...data, clientId });
      }
      onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ width: 460, padding: 22, background: "#fff", maxHeight: "85vh", overflowY: "auto" }}>
      <FormHeader title={initial ? "Edit job order" : "New job order"} onCancel={onCancel} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        <Field label="Job title"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Registered Nurse, ICU" /></Field>
        {!initial && (
          <Field label="Client">
            {clients.length === 0 ? (
              <p className="error-text">Add a client first.</p>
            ) : (
              <select className="select" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </Field>
        )}
        <Field label="Domain">
          <select className="select" value={domain} onChange={(e) => setDomain(e.target.value)}>
            {DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_LABELS[d]}</option>)}
          </select>
        </Field>
        <Field label="Location"><input className="input" value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Salary min"><input className="input" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value.replace(/\D/g, ""))} /></Field>
          <Field label="Salary max"><input className="input" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value.replace(/\D/g, ""))} /></Field>
        </div>
        <Field label="Job posting link">
          <input className="input" value={postingUrl} onChange={(e) => setPostingUrl(e.target.value)} placeholder="Client's careers page or job posting URL" />
        </Field>
        <Field label="Description"><textarea className="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      </div>
      <FormFooter onCancel={onCancel} onSubmit={submit} label={saving ? "Saving..." : initial ? "Save changes" : "Create job order"} disabled={saving || (!initial && clients.length === 0)} error={error} />
    </div>
  );
}

function JobDetail({ jobId, user, onBack }) {
  const [job, setJob] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [bdms, setBdms] = useState([]);
  const [error, setError] = useState("");
  const [showAssignPicker, setShowAssignPicker] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [showRecruiterPicker, setShowRecruiterPicker] = useState(false);
  const [showBDMPicker, setShowBDMPicker] = useState(false);
  const [editingJob, setEditingJob] = useState(false);

  const canManage = user.role === "ADMIN" || user.role === "BDM";
  const allowedStages = stagesForRole(user.role);

  async function load() {
    setError("");
    try {
      const [j, a] = await Promise.all([api.getJob(jobId), api.getJobAssignments(jobId)]);
      setJob(j);
      setAssignments(a);
      if (canManage) {
        const users = await api.listUsers().catch(() => []);
        setRecruiters(users.filter((u) => u.role === "RECRUITER"));
        setBdms(users.filter((u) => u.role === "BDM"));
      }
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { load(); }, [jobId]);

  // Server-side search, not a full-list fetch — this picker needs to stay
  // usable with thousands of candidates in the pool, so we query the same
  // way the Candidates tab does instead of loading everything up front.
  async function loadCandidates(term) {
    setCandidatesLoading(true);
    try {
      setCandidates(await api.getCandidates(term ? { q: term } : {}));
    } finally {
      setCandidatesLoading(false);
    }
  }

  useEffect(() => {
    if (!showAssignPicker) return;
    const t = setTimeout(() => loadCandidates(candidateSearch), 250);
    return () => clearTimeout(t);
  }, [candidateSearch, showAssignPicker]);

  async function handleAssignRecruiter(recruiterId) {
    await api.assignJob(jobId, recruiterId);
    setShowRecruiterPicker(false);
    load();
  }

  async function handleAssignBDM(bdmId) {
    await api.assignJobBDM(jobId, bdmId);
    setShowBDMPicker(false);
    load();
  }

  async function handleAddCandidate(candidateId) {
    await api.createAssignment(jobId, candidateId);
    setShowAssignPicker(false);
    load();
  }

  async function handleSetStage(assignmentId, stage) {
    try {
      await api.setAssignmentStage(assignmentId, stage);
      load();
    } catch (e) {
      alert(e.message); // deliberate: server's rejection message shown verbatim
    }
  }

  async function handleAddNote(text) {
    await api.addJobNote(jobId, text);
    load();
  }
  async function handleDeleteNote(noteId) {
    await api.deleteJobNote(jobId, noteId);
    load();
  }

  if (error) return <EmptyState text={`Couldn't load job: ${error}`} />;
  if (!job) return <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Loading...</p>;

  if (editingJob) {
    return (
      <div>
        <button className="btn btn-ghost" style={{ marginBottom: 14 }} onClick={() => setEditingJob(false)}>← Back to job order</button>
        <JobForm clients={[]} initial={job} onCancel={() => setEditingJob(false)} onCreated={() => { setEditingJob(false); load(); }} />
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 14 }} onClick={onBack}>← All job orders</button>
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 className="serif" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{job.title}</h2>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "4px 0 0" }}>{job.client?.name}</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <DomainBadge domain={job.domain} />
            {canManage && <button className="btn btn-ghost" onClick={() => setEditingJob(true)}>Edit</button>}
          </div>
        </div>

        <p style={{ fontSize: 13, marginTop: 10 }}>
          {job.location || "Location TBD"} · {(job.salaryMin || job.salaryMax) ? `$${job.salaryMin || "?"}–$${job.salaryMax || "?"}` : "Salary TBD"}
        </p>

        {job.description && <p style={{ fontSize: 13, marginTop: 10, whiteSpace: "pre-wrap" }}>{job.description}</p>}

        {job.postingUrl && (
          <p style={{ fontSize: 13, marginTop: 10 }}>
            🔗 <a href={job.postingUrl} target="_blank" rel="noreferrer" style={{ color: "var(--brand)" }}>{job.postingUrl}</a>
          </p>
        )}

        <p style={{ fontSize: 13, marginTop: 10 }}>
          Assigned recruiter: <strong>{job.assignedRecruiter?.name || "Unassigned"}</strong>
          {canManage && <button className="btn btn-ghost" style={{ marginLeft: 8, padding: "3px 8px" }} onClick={() => setShowRecruiterPicker(true)}>Change</button>}
        </p>
        <p style={{ fontSize: 13, marginTop: 6 }}>
          Assigned BDM: <strong>{job.assignedBDM?.name || "Unassigned"}</strong>
          {canManage && <button className="btn btn-ghost" style={{ marginLeft: 8, padding: "3px 8px" }} onClick={() => setShowBDMPicker(true)}>Change</button>}
        </p>

        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <span className="label" style={{ marginBottom: 0 }}>Status</span>
          {canManage ? (
            <select
              className="select"
              style={{ width: 170 }}
              value={job.status}
              onChange={async (e) => { await api.updateJob(job.id, { status: e.target.value }); load(); }}
            >
              {JOB_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          ) : (
            <StatusPill status={job.status} />
          )}
        </div>

        <p className="mono" style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 14 }}>
          Created by {job.createdBy?.name || "someone"} · {new Date(job.createdAt).toLocaleString()}
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h3 className="serif" style={{ fontSize: 15.5, fontWeight: 600, margin: 0 }}>Candidates in pipeline</h3>
        <button className="btn btn-primary" onClick={() => { setCandidateSearch(""); loadCandidates(""); setShowAssignPicker(true); }}>+ Add candidate</button>
      </div>

      {assignments.length === 0 && <EmptyState text="No candidates submitted to this job order yet." />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {assignments.map((a) => (
          <div key={a.id} className="card" style={{ padding: 15 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 13.5, margin: 0 }}>{a.candidate.name}</p>
                <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "2px 0 0" }}>{a.candidate.currentTitle || "No title on file"}</p>
              </div>
              <StageBadge stage={a.stage} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {ALL_STAGES.map((s) => {
                const allowed = allowedStages.includes(s);
                const active = s === a.stage;
                return (
                  <button
                    key={s}
                    className="mono"
                    disabled={!allowed}
                    onClick={() => handleSetStage(a.id, s)}
                    title={!allowed ? "Your role can't set this stage" : ""}
                    style={{
                      fontSize: 10, padding: "3px 8px", borderRadius: 20, cursor: allowed ? "pointer" : "not-allowed",
                      border: `1px solid ${active ? "var(--brand)" : "var(--line)"}`,
                      background: active ? "var(--brand)" : "#fff",
                      color: active ? "#fff" : allowed ? "var(--ink)" : "#B7C2BC",
                    }}
                  >
                    {STAGE_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <NotesSection notes={job.notes || []} onAdd={handleAddNote} onDelete={handleDeleteNote} />
      </div>

      {showRecruiterPicker && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowRecruiterPicker(false)}>
          <div className="card" style={{ width: 380, padding: 22, background: "#fff" }}>
            <FormHeader title="Assign recruiter" onCancel={() => setShowRecruiterPicker(false)} />
            {recruiters.length === 0 && <p style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>No recruiter accounts yet.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recruiters.map((r) => (
                <div key={r.id} className="card" style={{ padding: 10, cursor: "pointer" }} onClick={() => handleAssignRecruiter(r.id)}>
                  {r.name} <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>({r.email})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showBDMPicker && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowBDMPicker(false)}>
          <div className="card" style={{ width: 380, padding: 22, background: "#fff" }}>
            <FormHeader title="Assign BDM" onCancel={() => setShowBDMPicker(false)} />
            {bdms.length === 0 && <p style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>No BDM accounts yet.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {bdms.map((b) => (
                <div key={b.id} className="card" style={{ padding: 10, cursor: "pointer" }} onClick={() => handleAssignBDM(b.id)}>
                  {b.name} <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>({b.email})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAssignPicker && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowAssignPicker(false)}>
          <div className="card" style={{ width: 420, padding: 22, background: "#fff" }}>
            <FormHeader title="Submit candidate to this job" onCancel={() => setShowAssignPicker(false)} />
            <input
              className="input"
              style={{ marginBottom: 10 }}
              placeholder="Search candidates by name, title, or skill..."
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              autoFocus
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
              {candidatesLoading && <p className="mono" style={{ fontSize: 11, color: "var(--ink-soft)" }}>Searching...</p>}
              {!candidatesLoading && candidates.length === 0 && (
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                  {candidateSearch.trim() ? "No candidates match that search." : "No candidates yet — add one from the Candidates tab."}
                </p>
              )}
              {!candidatesLoading && candidates
                .filter((c) => !assignments.some((a) => a.candidate.id === c.id))
                .map((c) => (
                  <div key={c.id} className="card" style={{ padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => handleAddCandidate(c.id)}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{c.name}</p>
                      <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "2px 0 0" }}>{c.currentTitle || "No title on file"}</p>
                    </div>
                    <DomainBadge domain={c.domain} />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
