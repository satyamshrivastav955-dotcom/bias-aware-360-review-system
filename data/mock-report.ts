import { reportSchema } from "@/lib/schemas";
import type { InsufficientEvidence, Report } from "@/lib/types";
import emp001 from "./mock_reports/emp_001.json";
import emp002 from "./mock_reports/emp_002.json";
import emp003 from "./mock_reports/emp_003.json";

// known-limitation: these are real responses captured from the live n8n instance on
// 2026-08-01, not hand-written fixtures — so the offline path renders exactly
// what the backend produces, and the demo still runs if Gemini rate-limits.
// Recapture with: curl -X POST $N8N_WEBHOOK_URL/generate-review -d '{"employee_id":"emp_002"}'
const captured = [emp001, emp002, emp003].map((draft) =>
  reportSchema.parse({
    ...draft,
    created_at: new Date(0).toISOString(),
    audit_status: "complete",
    stripped_uncited_count: 0,
  }),
);

const drafts: Record<string, Report> = Object.fromEntries(
  captured.map((draft) => [draft.employee_id, draft]),
);

export function mockReport(employeeId: string): Report | null {
  const d = drafts[employeeId];
  if (!d) return null;
  // A fresh id per draft: two generations are two reports, as on the server.
  return {
    ...structuredClone(d),
    report_id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
}

export function mockInsufficientEvidence(employeeId: string): InsufficientEvidence | null {
  if (employeeId !== "emp_004") return null;
  return {
    insufficient: true,
    employee_id: employeeId,
    name: "Riya Kapoor",
    role: "Associate Software Engineer",
    message: "Not enough independent feedback on file to draft a fair, evidence-grounded review. No report was generated and no AI output was invented.",
    missing: ["peer_feedback", "goals", "project_outcomes"],
    evidence: { self_assessment: 1, manager_feedback: 1, peer_feedback: 0, goals: 0, project_outcomes: 0, meeting_notes: 0 },
  };
}
