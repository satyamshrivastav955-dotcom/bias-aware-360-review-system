// Schema v1.0 + the drift observed against the live n8n instance on 2026-08-01.

// The bias agent is a prompt, not an enum — it can emit a type nobody wrote
// down. `(string & {})` keeps autocomplete for the known five while letting an
// unknown type through to FLAG_LABEL, which titlecases it rather than blanking.
export type FlagType =
  | "unsupported_claim"
  | "recency_bias"
  | "single_source_bias"
  | "vague_language"
  | "contradiction"
  | (string & {});

export type Severity = "low" | "medium" | "high";

export type Flag = { type: FlagType; reasoning: string; severity: Severity };

export type Claim = { text: string; source_ids: string[]; flag: Flag | null };

export type SectionKey =
  | "strengths"
  | "growth_areas"
  | "impact_highlights"
  | "goal_progress";

export type ReportStatus = "pending_approval" | "approved" | "rejected";

export type Report = {
  report_id: string;
  employee_id: string;
  strengths: Claim[];
  growth_areas: Claim[];
  impact_highlights: Claim[];
  goal_progress: Claim[];
  overall_bias_summary: string;
  status: ReportStatus;
  reviewer: string | null;
  approved_at: string | null;
  created_at: string; // live n8n omits this; the route stamps it on arrival
  name?: string;
  role?: string;
};

// A high-severity flag blocks approval until it is amended or acknowledged.
// point_ref is the backend's addressing scheme: `growth_areas[1]`.
export type UnresolvedFlag = {
  point_ref: string;
  type: FlagType;
  text: string;
  reasoning: string;
};

export type ApproveBlocked = {
  error: "unresolved_high_severity_flags";
  detail: string;
  unresolved_count: number;
  unresolved: UnresolvedFlag[];
};

export const pointRef = (section: SectionKey, i: number) => `${section}[${i}]`;

export type Feedback = {
  id: string;
  reviewer: string;
  text: string;
  date: string;
};
export type Goal = {
  id: string;
  goal: string;
  status: "completed" | "in_progress";
  evidence: string;
};
export type Project = { id: string; project: string; outcome: string };

export type Employee = {
  employee_id: string;
  name: string;
  role: string;
  self_assessment: string;
  manager_feedback: Feedback[];
  peer_feedback: Feedback[];
  goals: Goal[];
  project_outcomes: Project[];
  meeting_notes: string[];
};

export type SourceKind =
  | "self"
  | "manager"
  | "peer"
  | "goal"
  | "project"
  | "meeting"
  | "unresolved";

export type Source = {
  id: string;
  kind: SourceKind;
  reviewer: string | null;
  text: string;
  date: string | null; // raw string — never passed to new Date()
};

export type AuditAction =
  | "generated"
  | "acknowledged"
  | "approved"
  | "rejected";

export type AuditEntry = {
  ts: string; // ISO, rendered raw in mono
  reviewer: string;
  action: AuditAction;
  report_id: string;
  summary: string;
};

// The server's own record, which carries the field-level diff the local copy
// cannot reconstruct. Shape from GET /webhook/audit-trail.
export type ServerAuditEntry = {
  id: string;
  report_id: string;
  employee_id: string;
  actor: string;
  action: string;
  at: string;
  report_status: ReportStatus;
  diff: {
    edits?: { point_ref: string; before: string; after: string }[];
    acknowledged_refs?: string[];
  } | null;
};

export type ApproveResponse = {
  report_id: string;
  status: ReportStatus;
  reviewer: string;
  approved_at: string | null;
};

// Workflow A declines to draft when the evidence on file is too thin (fewer
// than two reviewer voices, or no objective record at all). This is that
// response, passed through by the generate route — a refusal, not a report.
export type InsufficientEvidence = {
  insufficient: true;
  employee_id: string;
  name?: string;
  role?: string;
  message: string;
  missing: string[];
  evidence: Record<string, number>;
};

export type EditedFields = Partial<Record<SectionKey, Claim[]>>;

export const SECTIONS: { key: SectionKey; title: string; note: string }[] = [
  { key: "strengths", title: "Strengths", note: "What the evidence supports" },
  { key: "growth_areas", title: "Growth areas", note: "Where to develop next" },
  {
    key: "impact_highlights",
    title: "Impact",
    note: "Outcomes traced to projects",
  },
  { key: "goal_progress", title: "Goals", note: "Against stated commitments" },
];

const FLAG_LABELS: Record<string, string> = {
  unsupported_claim: "Unsupported claim",
  recency_bias: "Recency bias",
  single_source_bias: "Single-source bias",
  vague_language: "Vague language",
  contradiction: "Contradicted by evidence",
};

// An unlisted type still names itself legibly instead of rendering "undefined".
export const flagLabel = (t: FlagType) =>
  FLAG_LABELS[t] ??
  t.replace(/_/g, " ").replace(/^./, (c: string) => c.toUpperCase());

export const REVIEWER = "Manager";
