import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { DOMAINS, DOMAIN_LABELS } from "../stages.js";
import { readResumeFile, resumeFileName, resumeMimeType, extractFieldsFromText } from "../resumeFile.js";
import { DomainBadge, StageBadge, SearchBox, EmptyState, FormHeader, FormFooter, Field, NotesSection } from "./ui.jsx";

export default function CandidatesTab({ openId, setOpenId, q, setQ }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [domainFilter, setDomainFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (q) params.q = q;
      if (domainFilter !== "All") params.domain = domainFilter;
      if (locationFilter.trim()) params.location = locationFilter.trim();
      setCandidates(await api.getCandidates(params));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250); // light debounce while typing search
    return () => clearTimeout(t);
  }, [q, domainFilter, locationFilter]);

  // Keep a candidate selected in the right-hand panel at all times — default
  // to the first result whenever the current selection isn't in the list
  // (first load, or the filters changed and the old selection scrolled out).
  useEffect(() => {
    if (loading) return;
    if (candidates.length === 0) return;
    if (!candidates.some((c) => c.id === openId)) {
      setOpenId(candidates[0].id);
    }
  }, [loading, candidates]);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <SearchBox value={q} onChange={setQ} placeholder="Search name, title, skills, resume text" />
        <select className="select" style={{ width: 150 }} value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
          <option>All</option>
          {DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_LABELS[d]}</option>)}
        </select>
        <input
          className="input"
          style={{ width: 160 }}
          placeholder="Filter by location"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        />
        <button className="btn" onClick={() => setShowBulkUpload(true)}>📎 Bulk upload resumes</button>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add candidate</button>
      </div>

      {error && <EmptyState text={`Couldn't load candidates: ${error}`} />}
      {loading && !error && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Loading...</p>}
      {!loading && !error && candidates.length === 0 && <EmptyState text="No candidates match." />}

      {!loading && !error && candidates.length > 0 && (
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div
            style={{
              width: 300,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: "calc(100vh - 220px)",
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {candidates.map((c) => {
              const selected = c.id === openId;
              return (
                <div
                  key={c.id}
                  className="card"
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    borderColor: selected ? "var(--brand)" : undefined,
                    background: selected ? "var(--brand-tint)" : undefined,
                  }}
                  onClick={() => setOpenId(c.id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <h3 className="serif" style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{c.name}</h3>
                    <DomainBadge domain={c.domain} />
                  </div>
                  <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "0 0 4px" }}>{c.currentTitle || "No title on file"}</p>
                  {c.resumeUrl && (
                    <p style={{ fontSize: 10.5, color: "var(--ink-soft)", margin: "0 0 2px" }}>📄 {resumeFileName(c.resumeUrl)}</p>
                  )}
                  <p className="mono" style={{ fontSize: 10, color: "var(--ink-soft)", margin: 0 }}>
                    Added by {c.createdBy?.name || "unknown"}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {openId && <CandidateDetail key={openId} id={openId} onChanged={load} />}
          </div>
        </div>
      )}

      {showForm && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <CandidateForm onCancel={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
        </div>
      )}

      {showBulkUpload && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowBulkUpload(false)}>
          <BulkUploadModal onCancel={() => setShowBulkUpload(false)} onDone={() => { setShowBulkUpload(false); load(); }} />
        </div>
      )}
    </div>
  );
}

// Shared create/edit form. If `initial` is provided (an existing candidate),
// this edits it via PATCH instead of creating a new one.
function CandidateForm({ initial, onCancel, onSaved }) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [domain, setDomain] = useState(initial?.domain || "HEALTHCARE");
  const [currentTitle, setCurrentTitle] = useState(initial?.currentTitle || "");
  const [skills, setSkills] = useState(initial?.skills || "");
  const [resumeUrl, setResumeUrl] = useState(initial?.resumeUrl || "");
  const [resumeText, setResumeText] = useState(initial?.resumeText || "");
  const [resumeNote, setResumeNote] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setParsing(true);
    setResumeNote("");
    try {
      const local = await readResumeFile(file);
      setResumeUrl(local.resumeUrl);
      setResumeText(local.resumeText);

      try {
        const parsed = await api.parseResume(file);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.currentTitle) setCurrentTitle(parsed.currentTitle);
        if (parsed.skills) setSkills(parsed.skills);
        setResumeNote("Details auto-filled from the resume — please double-check before saving.");
      } catch (parseErr) {
        setResumeNote(`Uploaded, but couldn't auto-fill details: ${parseErr.message}`);
      }
    } catch (err) {
      setResumeNote("Couldn't read that file — you can still save the candidate without it.");
    } finally {
      setParsing(false);
    }
  }

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const data = { name: name.trim(), email, phone, address, domain, currentTitle, skills, resumeUrl, resumeText };
    try {
      if (initial) {
        await api.updateCandidate(initial.id, data);
      } else {
        await api.createCandidate(data);
      }
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ width: 480, padding: 22, background: "#fff", maxHeight: "85vh", overflowY: "auto" }}>
      <FormHeader title={initial ? "Edit candidate" : "Add candidate"} onCancel={onCancel} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        <Field label="Full name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Amara Chen" /></Field>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Email"><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Phone"><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        </div>
        <Field label="Address"><input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City, State" /></Field>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Domain">
            <select className="select" value={domain} onChange={(e) => setDomain(e.target.value)}>
              {DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_LABELS[d]}</option>)}
            </select>
          </Field>
          <Field label="Current title"><input className="input" value={currentTitle} onChange={(e) => setCurrentTitle(e.target.value)} /></Field>
        </div>
        <Field label="Skills (comma separated)"><input className="input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="ACLS, EPIC, Med-Surg" /></Field>
        <Field label="Resume">
          <label className="btn" style={{ cursor: "pointer", justifyContent: "center", width: "100%" }}>
            📎 {resumeUrl ? `Replace resume (${resumeFileName(resumeUrl)})` : "Upload resume — auto-fills the fields above"}
            <input type="file" accept=".docx,.pdf,.doc" style={{ display: "none" }} onChange={handleFile} />
          </label>
          {parsing && <p className="mono" style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 6 }}>Reading and parsing resume...</p>}
          {resumeNote && <p style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 6 }}>{resumeNote}</p>}
        </Field>
      </div>
      <FormFooter onCancel={onCancel} onSubmit={submit} label={saving ? "Saving..." : initial ? "Save changes" : "Add candidate"} disabled={saving} error={error} />
    </div>
  );
}

function BulkUploadModal({ onCancel, onDone }) {
  const [rows, setRows] = useState([]); // { key, fileName, resumeUrl, resumeText, name, email, phone, domain, currentTitle, skills, autoNote }
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [progress, setProgress] = useState(0);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setReading(true);
    const newRows = [];
    for (const file of files) {
      try {
        const local = await readResumeFile(file);
        let guess = { name: "", email: "", phone: "", address: "", currentTitle: "", skills: "" };
        let autoNote = "Uploaded — fill in details manually.";
        try {
          const parsed = await api.parseResume(file);
          guess = parsed;
          autoNote = parsed.name || parsed.email
            ? "Details auto-filled from the resume — please verify before saving."
            : "Resume parsed, but no name/email pattern found — please fill in.";
        } catch (parseErr) {
          autoNote = `Couldn't auto-fill: ${parseErr.message}`;
        }
        newRows.push({
          key: `${file.name}-${Math.random()}`,
          fileName: file.name,
          resumeUrl: local.resumeUrl,
          resumeText: local.resumeText,
          name: guess.name || file.name.replace(/\.[^.]+$/, ""),
          email: guess.email || "",
          phone: guess.phone || "",
          address: guess.address || "",
          domain: "HEALTHCARE",
          currentTitle: guess.currentTitle || "",
          skills: guess.skills || "",
          autoNote,
        });
      } catch (err) {
        newRows.push({
          key: `${file.name}-${Math.random()}`,
          fileName: file.name,
          resumeUrl: "",
          resumeText: "",
          name: file.name.replace(/\.[^.]+$/, ""),
          email: "",
          phone: "",
          address: "",
          domain: "HEALTHCARE",
          currentTitle: "",
          skills: "",
          autoNote: "Couldn't read this file — you can still add it manually or remove it.",
        });
      }
    }
    setRows((r) => [...r, ...newRows]);
    setReading(false);
  }

  function updateRow(key, field, value) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }
  function removeRow(key) {
    setRows((rs) => rs.filter((r) => r.key !== key));
  }

  async function handleSaveAll() {
    setSaving(true);
    setSaveError("");
    setProgress(0);
    let completed = 0;
    for (const row of rows) {
      if (!row.name.trim()) continue; // skip rows without at least a name
      try {
        await api.createCandidate({
          name: row.name.trim(),
          email: row.email,
          phone: row.phone,
          address: row.address,
          domain: row.domain,
          currentTitle: row.currentTitle,
          skills: row.skills,
          resumeUrl: row.resumeUrl,
          resumeText: row.resumeText,
        });
        completed++;
        setProgress(completed);
      } catch (e) {
        setSaveError(`Stopped after ${completed} of ${rows.length}: ${e.message}`);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    onDone();
  }

  return (
    <div className="card" style={{ width: 640, padding: 22, background: "#fff", maxHeight: "85vh", overflowY: "auto" }}>
      <FormHeader title="Bulk upload resumes" onCancel={onCancel} />

      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 14 }}>
        Select multiple resumes at once. Name, email, phone, address, and current title are auto-filled
        from the resume for both <strong>.docx and .pdf</strong> files — check them below before saving.
        Click "Preview" on any row to see the resume without leaving this screen.
      </p>

      <label className="btn" style={{ cursor: "pointer", justifyContent: "center", width: "100%", marginBottom: 16 }}>
        📎 Choose resume files (.docx, .pdf)
        <input type="file" accept=".docx,.pdf,.doc" multiple style={{ display: "none" }} onChange={handleFiles} />
      </label>
      {reading && <p className="mono" style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 12 }}>Reading files...</p>}

      {rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
          {rows.map((row) => (
            <BulkUploadRow
              key={row.key}
              row={row}
              onUpdate={(field, value) => updateRow(row.key, field, value)}
              onRemove={() => removeRow(row.key)}
            />
          ))}
        </div>
      )}

      {saving && <p className="mono" style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 10 }}>Saving {progress} of {rows.length}...</p>}
      <FormFooter
        onCancel={onCancel}
        onSubmit={handleSaveAll}
        label={saving ? "Saving..." : `Add all (${rows.length})`}
        disabled={saving || rows.length === 0}
        error={saveError}
      />
    </div>
  );
}

function BulkUploadRow({ row, onUpdate, onRemove }) {
  const [showPreview, setShowPreview] = useState(false);
  const mime = resumeMimeType(row.resumeUrl);

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p className="mono" style={{ fontSize: 11, color: "var(--ink-soft)", margin: 0 }}>📄 {row.fileName}</p>
        <div style={{ display: "flex", gap: 6 }}>
          {row.resumeUrl && (
            <button className="btn btn-ghost" style={{ padding: "2px 8px" }} onClick={() => setShowPreview((s) => !s)}>
              {showPreview ? "Hide preview" : "Preview"}
            </button>
          )}
          <button className="btn btn-ghost" style={{ padding: "2px 8px" }} onClick={onRemove}>Remove</button>
        </div>
      </div>
      {row.autoNote && <p style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 8 }}>{row.autoNote}</p>}

      {showPreview && row.resumeUrl && (
        mime === "application/pdf" ? (
          <embed src={row.resumeUrl} type="application/pdf" width="100%" height="320" style={{ borderRadius: 8, border: "1px solid var(--line)", marginBottom: 10 }} />
        ) : (
          <p style={{ fontSize: 12, color: "var(--ink-soft)", background: "#F6F7F3", padding: 10, borderRadius: 8, marginBottom: 10 }}>
            This file type can't be previewed inline — it'll still be saved and downloadable from the candidate's profile.
          </p>
        )
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Field label="Full name">
          <input className="input" value={row.name} onChange={(e) => onUpdate("name", e.target.value)} />
        </Field>
        <div style={{ display: "flex", gap: 8 }}>
          <Field label="Email"><input className="input" value={row.email} onChange={(e) => onUpdate("email", e.target.value)} /></Field>
          <Field label="Phone"><input className="input" value={row.phone} onChange={(e) => onUpdate("phone", e.target.value)} /></Field>
        </div>
        <Field label="Address"><input className="input" value={row.address} onChange={(e) => onUpdate("address", e.target.value)} placeholder="City, State" /></Field>
        <div style={{ display: "flex", gap: 8 }}>
          <Field label="Domain">
            <select className="select" value={row.domain} onChange={(e) => onUpdate("domain", e.target.value)}>
              {DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_LABELS[d]}</option>)}
            </select>
          </Field>
          <Field label="Current title"><input className="input" value={row.currentTitle} onChange={(e) => onUpdate("currentTitle", e.target.value)} /></Field>
        </div>
        <Field label="Skills (comma separated)"><input className="input" value={row.skills} onChange={(e) => onUpdate("skills", e.target.value)} placeholder="Add skill tags so this candidate is searchable" /></Field>
      </div>
    </div>
  );
}

function CandidateDetail({ id, onChanged }) {
  const [candidate, setCandidate] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  async function load() {
    setError("");
    try {
      setCandidate(await api.getCandidate(id));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { load(); }, [id]);

  async function handleAddNote(text) {
    await api.addNote(id, text);
    load();
  }
  async function handleDeleteNote(noteId) {
    await api.deleteNote(id, noteId);
    load();
  }

  if (error) return <EmptyState text={`Couldn't load candidate: ${error}`} />;
  if (!candidate) return <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Loading...</p>;

  if (editing) {
    return (
      <div>
        <button className="btn btn-ghost" style={{ marginBottom: 14 }} onClick={() => setEditing(false)}>← Back to candidate</button>
        <CandidateForm
          initial={candidate}
          onCancel={() => setEditing(false)}
          onSaved={() => { setEditing(false); load(); onChanged && onChanged(); }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 className="serif" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{candidate.name}</h2>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "4px 0 0" }}>{candidate.currentTitle || "No title on file"}</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {candidate.assignments?.[0] && <StageBadge stage={candidate.assignments[0].stage} />}
            <DomainBadge domain={candidate.domain} />
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit</button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14, fontSize: 13 }}>
          {candidate.email && <div>✉️ {candidate.email}</div>}
          {candidate.phone && <div>📞 {candidate.phone}</div>}
          {candidate.address && (
            <div>
              📍 {candidate.address} · {new Date(candidate.createdAt).toLocaleDateString()} · added by{" "}
              <strong>{candidate.createdBy?.name || "unknown"}</strong>
            </div>
          )}
          {!candidate.address && (
            <p className="mono" style={{ fontSize: 11, color: "var(--ink-soft)", margin: 0 }}>
              Added {new Date(candidate.createdAt).toLocaleDateString()} by{" "}
              <strong>{candidate.createdBy?.name || "unknown"}</strong>
            </p>
          )}
        </div>

        {candidate.skills && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
            {candidate.skills.split(",").filter(Boolean).map((s, i) => (
              <span key={i} className="mono" style={{ fontSize: 10.5, background: "#F6F7F3", padding: "3px 8px", borderRadius: 20 }}>{s.trim()}</span>
            ))}
          </div>
        )}

        {candidate.resumeUrl ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <p className="mono" style={{ fontSize: 11, color: "var(--ink-soft)", margin: 0 }}>📄 {resumeFileName(candidate.resumeUrl)}</p>
              <a
                href={candidate.resumeUrl}
                download={resumeFileName(candidate.resumeUrl)}
                className="btn"
                style={{ display: "inline-flex", textDecoration: "none", padding: "6px 12px" }}
              >
                ⬇ Download
              </a>
            </div>
            {resumeMimeType(candidate.resumeUrl) === "application/pdf" ? (
              <embed src={candidate.resumeUrl} type="application/pdf" width="100%" height="500" style={{ borderRadius: 8, border: "1px solid var(--line)" }} />
            ) : (
              <p style={{ fontSize: 12.5, color: "var(--ink-soft)", background: "#F6F7F3", padding: 12, borderRadius: 8 }}>
                This file type can't be previewed here — use Download to open it.
              </p>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 14 }}>No resume on file — click Edit to upload one.</p>
        )}

      </div>

      <h3 className="serif" style={{ fontSize: 15.5, fontWeight: 600, margin: "0 0 10px" }}>Pipeline activity</h3>
      {(candidate.assignments || []).length === 0 && <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 16 }}>Not currently submitted to any job order.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {(candidate.assignments || []).map((a) => (
          <div key={a.id} className="card" style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ fontSize: 13, margin: 0, fontWeight: 500 }}>{a.job?.title}</p>
                {a.job?.domain && <DomainBadge domain={a.job.domain} />}
              </div>
              <StageBadge stage={a.stage} />
            </div>
            <p className="mono" style={{ fontSize: 10.5, color: "var(--ink-soft)", margin: "6px 0 0" }}>
              Last updated {new Date(a.updatedAt).toLocaleString()}{a.lastUpdatedBy?.name ? ` by ${a.lastUpdatedBy.name}` : ""}
            </p>
          </div>
        ))}
      </div>

      <NotesSection notes={candidate.notes || []} onAdd={handleAddNote} onDelete={handleDeleteNote} />
    </div>
  );
}
