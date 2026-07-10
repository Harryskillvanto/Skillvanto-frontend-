import React, { useState, useEffect, useMemo } from "react";
import { api } from "../api.js";
import { DOMAINS, DOMAIN_LABELS } from "../stages.js";
import { readResumeFile, resumeFileName, resumeMimeType } from "../resumeFile.js";
import { DomainBadge, StatusPill, SearchBox, EmptyState, FormHeader, FormFooter, Field, NotesSection } from "./ui.jsx";

export default function ClientsTab({ user, onOpenJob }) {
  const [clients, setClients] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openClientId, setOpenClientId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const canManage = user.role === "ADMIN" || user.role === "BDM";

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [c, j] = await Promise.all([api.getClients(), api.getJobs()]);
      setClients(c);
      setJobs(j);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(s) || (c.contactName || "").toLowerCase().includes(s));
  }, [clients, q]);

  if (error) return <EmptyState text={`Couldn't load clients: ${error}`} />;
  if (loading) return <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Loading...</p>;

  if (openClientId) {
    return (
      <ClientDetail
        id={openClientId}
        user={user}
        onBack={() => { setOpenClientId(null); load(); }}
        onOpenJob={onOpenJob}
      />
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <SearchBox value={q} onChange={setQ} placeholder="Search clients by name or contact" />
        {canManage && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New client</button>}
      </div>
      {filtered.length === 0 && <EmptyState text="No clients yet." />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {filtered.map((c) => (
          <div key={c.id} className="card" style={{ padding: 16, cursor: "pointer" }} onClick={() => setOpenClientId(c.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <h3 className="serif" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{c.name}</h3>
              <DomainBadge domain={c.industry} />
            </div>
            {c.contactName && <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 4px" }}>{c.contactName}</p>}
            <p className="mono" style={{ fontSize: 11, color: "var(--ink-soft)", margin: 0 }}>
              {c._count?.jobOrders ?? 0} job order{(c._count?.jobOrders ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <ClientForm onCancel={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
        </div>
      )}
    </div>
  );
}

function ClientForm({ initial, onCancel, onSaved }) {
  const [name, setName] = useState(initial?.name || "");
  const [industry, setIndustry] = useState(initial?.industry || "HEALTHCARE");
  const [contactName, setContactName] = useState(initial?.contactName || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [legacyNotes, setLegacyNotes] = useState(initial?.legacyNotes || "");
  const [agreementUrl, setAgreementUrl] = useState(initial?.agreementUrl || "");
  const [agreementNote, setAgreementNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAgreementFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setAgreementNote("");
    try {
      const result = await readResumeFile(file);
      setAgreementUrl(result.resumeUrl);
      setAgreementNote("Agreement attached.");
    } catch (err) {
      setAgreementNote("Couldn't read that file — try again or skip it for now.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const data = { name: name.trim(), industry, contactName, email, phone, address, legacyNotes, agreementUrl };
    try {
      if (initial) {
        await api.updateClient(initial.id, data);
      } else {
        await api.createClient(data);
      }
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ width: 460, padding: 22, background: "#fff", maxHeight: "85vh", overflowY: "auto" }}>
      <FormHeader title={initial ? "Edit client" : "New client"} onCancel={onCancel} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        <Field label="Company name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Meridian Health Group" /></Field>
        <Field label="Domain">
          <select className="select" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            {DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_LABELS[d]}</option>)}
          </select>
        </Field>
        <Field label="Primary contact"><input className="input" value={contactName} onChange={(e) => setContactName(e.target.value)} /></Field>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Email"><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Phone"><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        </div>
        <Field label="Address"><input className="input" value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
        <Field label="General notes"><textarea className="textarea" rows={2} value={legacyNotes} onChange={(e) => setLegacyNotes(e.target.value)} /></Field>
        <Field label="Signed agreement">
          <label className="btn" style={{ cursor: "pointer", justifyContent: "center", width: "100%" }}>
            📎 {agreementUrl ? `Replace agreement (${resumeFileName(agreementUrl)})` : "Upload signed agreement"}
            <input type="file" accept=".pdf,.docx,.doc" style={{ display: "none" }} onChange={handleAgreementFile} />
          </label>
          {uploading && <p className="mono" style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 6 }}>Uploading...</p>}
          {agreementNote && <p style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 6 }}>{agreementNote}</p>}
        </Field>
      </div>
      <FormFooter onCancel={onCancel} onSubmit={submit} label={saving ? "Saving..." : initial ? "Save changes" : "Add client"} disabled={saving} error={error} />
    </div>
  );
}

function ClientDetail({ id, user, onBack, onOpenJob }) {
  const [client, setClient] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const canManage = user.role === "ADMIN" || user.role === "BDM";

  async function load() {
    setError("");
    try {
      setClient(await api.getClient(id));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { load(); }, [id]);

  async function handleDelete() {
    await api.deleteClient(id);
    onBack();
  }
  async function handleAddNote(text) {
    await api.addClientNote(id, text);
    load();
  }
  async function handleDeleteNote(noteId) {
    await api.deleteClientNote(id, noteId);
    load();
  }

  if (error) return <EmptyState text={`Couldn't load client: ${error}`} />;
  if (!client) return <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Loading...</p>;

  if (editing) {
    return (
      <div>
        <button className="btn btn-ghost" style={{ marginBottom: 14 }} onClick={() => setEditing(false)}>← Back to client</button>
        <ClientForm initial={client} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />
      </div>
    );
  }

  const agreementMime = resumeMimeType(client.agreementUrl);

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 14 }} onClick={onBack}>← All clients</button>
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 className="serif" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{client.name}</h2>
            <div style={{ marginTop: 6 }}><DomainBadge domain={client.industry} /></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {canManage && <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit</button>}
            {user.role === "ADMIN" && (
              <button className="btn btn-ghost" style={{ color: "#8A3D1C" }} onClick={handleDelete}>Delete</button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14, fontSize: 13 }}>
          {client.contactName && <div>{client.contactName}</div>}
          {client.email && <div>✉️ {client.email}</div>}
          {client.phone && <div>📞 {client.phone}</div>}
          {client.address && <div>📍 {client.address}</div>}
        </div>

        {client.legacyNotes && (
          <p style={{ fontSize: 13, marginTop: 12, background: "#F6F7F3", padding: 10, borderRadius: 8, whiteSpace: "pre-wrap" }}>{client.legacyNotes}</p>
        )}

        {client.agreementUrl ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <p className="mono" style={{ fontSize: 11, color: "var(--ink-soft)", margin: 0 }}>📄 {resumeFileName(client.agreementUrl)}</p>
              <a href={client.agreementUrl} download={resumeFileName(client.agreementUrl)} className="btn" style={{ padding: "6px 12px", textDecoration: "none" }}>⬇ Download</a>
            </div>
            {agreementMime === "application/pdf" && (
              <embed src={client.agreementUrl} type="application/pdf" width="100%" height="400" style={{ borderRadius: 8, border: "1px solid var(--line)" }} />
            )}
          </div>
        ) : (
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 14 }}>No signed agreement on file.</p>
        )}

        <p className="mono" style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 14 }}>
          Added by {client.createdBy?.name || "someone"} · {new Date(client.createdAt).toLocaleString()}
        </p>
      </div>

      <h3 className="serif" style={{ fontSize: 15.5, fontWeight: 600, margin: "0 0 10px" }}>Job orders</h3>
      {(client.jobOrders || []).length === 0 && <EmptyState text="No job orders for this client yet." />}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {(client.jobOrders || []).map((j) => (
          <div key={j.id} className="card" style={{ padding: 14, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => onOpenJob(j.id)}>
            <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0 }}>{j.title}</p>
            <StatusPill status={j.status} />
          </div>
        ))}
      </div>

      <NotesSection notes={client.notes || []} onAdd={handleAddNote} onDelete={handleDeleteNote} />
    </div>
  );
}
