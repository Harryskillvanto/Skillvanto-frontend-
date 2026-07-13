// In production this comes from VITE_API_URL (set at build time on Render).
// Locally, it falls back to your backend running on localhost.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

let token = sessionStorage.getItem("skillvanto_token") || null;
let currentUser = JSON.parse(sessionStorage.getItem("skillvanto_user") || "null");

export function getToken() {
  return token;
}
export function getCurrentUser() {
  return currentUser;
}
export function setSession(newToken, user) {
  token = newToken;
  currentUser = user;
  if (newToken) {
    sessionStorage.setItem("skillvanto_token", newToken);
    sessionStorage.setItem("skillvanto_user", JSON.stringify(user));
  } else {
    sessionStorage.removeItem("skillvanto_token");
    sessionStorage.removeItem("skillvanto_user");
  }
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (err) {
    throw new Error(
      "Couldn't reach the Skillvanto server. Make sure the backend is running at http://localhost:4000."
    );
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof body === "object" && body?.error ? body.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

async function requestMultipart(path, formData) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method: "POST", headers, body: formData });
  } catch (err) {
    throw new Error("Couldn't reach the Skillvanto server. Make sure the backend is running at http://localhost:4000.");
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof body === "object" && body?.error ? body.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

export const api = {
  // Auth
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request("/auth/me"),
  listUsers: () => request("/auth/users"),
  createUser: (data) => request("/auth/users", { method: "POST", body: JSON.stringify(data) }),
  deactivateUser: (id) => request(`/auth/users/${id}/deactivate`, { method: "PATCH" }),
  activateUser: (id) => request(`/auth/users/${id}/activate`, { method: "PATCH" }),
  updateUserRole: (id, role) => request(`/auth/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),

  // Clients
  getClients: () => request("/clients"),
  getClient: (id) => request(`/clients/${id}`),
  createClient: (data) => request("/clients", { method: "POST", body: JSON.stringify(data) }),
  updateClient: (id, data) => request(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteClient: (id) => request(`/clients/${id}`, { method: "DELETE" }),
  addClientNote: (clientId, text) => request(`/clients/${clientId}/notes`, { method: "POST", body: JSON.stringify({ text }) }),
  deleteClientNote: (clientId, noteId) => request(`/clients/${clientId}/notes/${noteId}`, { method: "DELETE" }),

  // Jobs
  getJobs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/jobs${qs ? `?${qs}` : ""}`);
  },
  getJob: (id) => request(`/jobs/${id}`),
  createJob: (data) => request("/jobs", { method: "POST", body: JSON.stringify(data) }),
  updateJob: (id, data) => request(`/jobs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  assignJob: (id, recruiterId) => request(`/jobs/${id}/assign`, { method: "PATCH", body: JSON.stringify({ recruiterId }) }),
  assignJobBDM: (id, bdmId) => request(`/jobs/${id}/assign-bdm`, { method: "PATCH", body: JSON.stringify({ bdmId }) }),
  deleteJob: (id) => request(`/jobs/${id}`, { method: "DELETE" }),
  addJobNote: (jobId, text) => request(`/jobs/${jobId}/notes`, { method: "POST", body: JSON.stringify({ text }) }),
  deleteJobNote: (jobId, noteId) => request(`/jobs/${jobId}/notes/${noteId}`, { method: "DELETE" }),

  // Candidates
  getCandidates: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/candidates${qs ? `?${qs}` : ""}`);
  },
  getCandidate: (id) => request(`/candidates/${id}`),
  createCandidate: (data) => request("/candidates", { method: "POST", body: JSON.stringify(data) }),
  parseResume: (file) => {
    const form = new FormData();
    form.append("file", file);
    return requestMultipart("/candidates/parse-resume", form);
  },
  updateCandidate: (id, data) => request(`/candidates/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCandidate: (id) => request(`/candidates/${id}`, { method: "DELETE" }),
  addNote: (candidateId, text) => request(`/candidates/${candidateId}/notes`, { method: "POST", body: JSON.stringify({ text }) }),
  deleteNote: (candidateId, noteId) => request(`/candidates/${candidateId}/notes/${noteId}`, { method: "DELETE" }),

  // Assignments (pipeline)
  getJobAssignments: (jobId) => request(`/jobs/${jobId}/assignments`),
  createAssignment: (jobId, candidateId) => request(`/jobs/${jobId}/assignments`, { method: "POST", body: JSON.stringify({ candidateId }) }),
  setAssignmentStage: (id, stage) => request(`/assignments/${id}/stage`, { method: "PATCH", body: JSON.stringify({ stage }) }),
  deleteAssignment: (id) => request(`/assignments/${id}`, { method: "DELETE" }),

  // Submissions (org-wide view of every candidate-job pairing)
  getSubmissions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/assignments${qs ? `?${qs}` : ""}`);
  },
  getSubmission: (id) => request(`/assignments/${id}`),
  addSubmissionNote: (id, text) => request(`/assignments/${id}/notes`, { method: "POST", body: JSON.stringify({ text }) }),
  deleteSubmissionNote: (id, noteId) => request(`/assignments/${id}/notes/${noteId}`, { method: "DELETE" }),

  // Notifications
  getNotifications: () => request("/notifications"),
  getUnreadCount: () => request("/notifications/unread-count"),
  markRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => request("/notifications/read-all", { method: "PATCH" }),
};
