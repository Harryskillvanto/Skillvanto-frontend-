export const DOMAINS = ["HEALTHCARE", "LEGAL", "OTHER"];
export const JOB_STATUSES = ["OPEN", "ON_HOLD", "CLOSED", "CLOSED_WON"];

export const RECRUITER_STAGES = ["PROSPECT", "SCREENED", "SUBMITTED_TO_BDM"];
export const BDM_STAGES = [
  "SUBMITTED_TO_CLIENT",
  "INTERVIEWED",
  "OFFERED",
  "PLACEMENT",
  "BDM_REJECTED",
  "CLIENT_REJECTED",
  "BACKED_OUT",
];
export const ALL_STAGES = [...RECRUITER_STAGES, ...BDM_STAGES];

export const STAGE_LABELS = {
  PROSPECT: "Prospect",
  SCREENED: "Screened",
  SUBMITTED_TO_BDM: "Submitted to BDM",
  SUBMITTED_TO_CLIENT: "Submitted to Client",
  INTERVIEWED: "Interviewed",
  OFFERED: "Offered",
  PLACEMENT: "Placement",
  BDM_REJECTED: "BDM Rejected",
  CLIENT_REJECTED: "Client Rejected",
  BACKED_OUT: "Backed Out",
};

export const DOMAIN_LABELS = { HEALTHCARE: "Healthcare", LEGAL: "Legal", OTHER: "Other" };
export const STATUS_LABELS = { OPEN: "Open", ON_HOLD: "On hold", CLOSED: "Closed", CLOSED_WON: "Closed Won" };

// Which stages a given role is allowed to set. Mirrors src/lib/stages.js on
// the backend — this only controls what the UI *offers*; the server is the
// real enforcement point regardless of what this returns.
export function stagesForRole(role) {
  if (role === "ADMIN") return ALL_STAGES;
  if (role === "RECRUITER") return RECRUITER_STAGES;
  if (role === "BDM") return BDM_STAGES;
  return [];
}
