import React, { useState, useEffect, useMemo } from "react";
import { api } from "../api.js";
import { DOMAINS, ALL_STAGES, STAGE_LABELS, DOMAIN_LABELS, stagesForRole } from "../stages.js";
import { DomainBadge, StageBadge, SearchBox, EmptyState, NotesSection } from "./ui.jsx";

// Org-wide view of every candidate-job pairing ("submission"), across every
// job order — so a BDM or Admin can see the whole pipeline at once instead
// of clicking into each job individually. Each submission also has its own
// feedback/interview notes log, separate from the candidate's or job's
// general notes, since "how this candidate did in this interview" belongs
// to that one submission, not the candidate or job as a whole.
export default function SubmissionsTab({ user, onOpenJob, onOpenCandidate }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [domainFilter, setDomainFilter] = useState("All");
  const [openId, setOpenId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (stageFilter !== "All") params.stage = stageFilter;
      if (domainFilter !== "All") params.domain = domainFilter;
      setSubmissions(await api.getSubmissions(params));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [stageFilter, domainFilter]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return submissions;
    return submissions.filter(
      (a) =>
        a.candidate.name.toLowerCase().includes(s) ||
        a.job.title.toLowerCase().includes(s) ||
        (a.job.client?.name || "").toLowerCase().includes(s)
    );
  }, [submissions, q]);

  if (openId) {
    return (
      <SubmissionDetail
        id={openId}
        user={user}
        onBack={() => { setOpenId(null); load(); }}
        onOpenJob={onOpenJob}
        onOpenCandidate={onOpenCandidate}
      />
    );
  }

  if (error) return <EmptyState text={`Couldn't load submissions: ${error}`} />;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <SearchBox value={q} onChange={setQ} placeholder="Search by candidate, job, or client" />
        <select className="select" style={{ width: 170 }} value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
          <option>All</option>
          {ALL_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
        </select>
        <select className="select" style={{ width: 150 }} value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
          <option>All</option>
          {DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_LABELS[d]}</option>)}
        </select>
      </div>

      {loading && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Loading...</p>}
      {!loading && filtered.length === 0 && <EmptyState text="No submissions match." />}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((a) => (
          <div key={a.id} className="card" style={{ padding: 15, cursor: "pointer" }} onClick={() => setOpenId(a.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{a.candidate.name}</p>
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "3px 0 0" }}>
                  {a.job.title} · {a.job.client?.name || "No client"}
                </p>
                <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "3px 0 0" }}>
                  Recruiter: {a.job.assignedRecruiter?.name || "Unassigned"} · BDM: {a.job.assignedBDM?.name || "Unassigned"}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <DomainBadge domain={a.job.domain} />
                <StageBadge stage={a.stage} />
              </div>
            </div>
            <p className="mono" style={{ fontSize: 10.5, color: "var(--ink-soft)", margin: "10px 0 0" }}>
              Last updated by {a.lastUpdatedBy?.name || "someone"} · {new Date(a.updatedAt).toLocaleString()}
              {a._count?.notes ? ` · ${a._count.notes} note${a._count.notes !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubmissionDetail({ id, user, onBack, onOpenJob, onOpenCandidate }) {
  const [assignment, setAssignment] = useState(null);
  const [error, setError] = useState("");

  const allowedStages = stagesForRole(user.role);

  async function load() {
    setError("");
    try {
      setAssignment(await api.getSubmission(id));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { load(); }, [id]);

  async function handleSetStage(stage) {
    try {
      await api.setAssignmentStage(id, stage);
      load();
    } catch (e) {
      alert(e.message); // deliberate: server's rejection message shown verbatim
    }
  }

  async function handleAddNote(text) {
    await api.addSubmissionNote(id, text);
    load();
  }
  async function handleDeleteNote(noteId) {
    await api.deleteSubmissionNote(id, noteId);
    load();
  }

  if (error) return <EmptyState text={`Couldn't load submission: ${error}`} />;
  if (!assignment) return <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Loading...</p>;

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 14 }} onClick={onBack}>← All submissions</button>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h2 className="serif" style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>
              <span style={{ cursor: "pointer" }} onClick={() => onOpenCandidate && onOpenCandidate(assignment.candidate.id)}>
                {assignment.candidate.name}
              </span>
              {" → "}
              <span style={{ cursor: "pointer" }} onClick={() => onOpenJob && onOpenJob(assignment.job.id)}>
                {assignment.job.title}
              </span>
            </h2>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "4px 0 0" }}>
              {assignment.job.client?.name || "No client"} · {assignment.candidate.currentTitle || "No title on file"}
            </p>
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 0" }}>
              Recruiter: <strong>{assignment.job.assignedRecruiter?.name || "Unassigned"}</strong> · BDM: <strong>{assignment.job.assignedBDM?.name || "Unassigned"}</strong>
            </p>
          </div>
          <DomainBadge domain={assignment.job.domain} />
        </div>

        <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ALL_STAGES.map((s) => {
            const allowed = allowedStages.includes(s);
            const active = s === assignment.stage;
            return (
              <button
                key={s}
                className="mono"
                disabled={!allowed}
                onClick={() => handleSetStage(s)}
                title={!allowed ? "Your role can't set this stage" : ""}
                style={{
                  fontSize: 10.5, padding: "4px 10px", borderRadius: 20, cursor: allowed ? "pointer" : "not-allowed",
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

        <p className="mono" style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 14 }}>
          Last updated by {assignment.lastUpdatedBy?.name || "someone"} · {new Date(assignment.updatedAt).toLocaleString()}
        </p>
      </div>

      <h3 className="serif" style={{ fontSize: 15.5, fontWeight: 600, margin: "0 0 4px" }}>Feedback & interview notes</h3>
      <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "0 0 12px" }}>
        Log client feedback, interview notes, or anything specific to this submission — separate from {assignment.candidate.name}'s general profile notes.
      </p>
      <NotesSection notes={assignment.notes || []} onAdd={handleAddNote} onDelete={handleDeleteNote} />
    </div>
  );
}
