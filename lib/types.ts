// Schema v1.0 — frozen. Any change requires a team sync.

export type FlagType =
  | "unsupported_claim"
  | "recency_bias"
  | "single_source_bias"
  | "vague_language";

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
  created_at: string;
};

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

export type AuditAction = "generated" | "edit" | "approve" | "reject";

export type AuditEntry = {
  ts: string; // ISO, rendered raw in mono
  reviewer: string;
  action: AuditAction;
  report_id: string;
  summary: string;
};

export type ApproveResponse = {
  report_id: string;
  status: ReportStatus;
  reviewer: string;
  approved_at: string | null;
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

export const FLAG_LABEL: Record<FlagType, string> = {
  unsupported_claim: "Unsupported claim",
  recency_bias: "Recency bias",
  single_source_bias: "Single-source bias",
  vague_language: "Vague language",
};

export const REVIEWER = "Manager";
