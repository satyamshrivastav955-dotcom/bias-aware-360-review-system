import type { FlagType, SectionKey, Severity } from "@/lib/types";

export type ExpectedFlag = {
  type: FlagType;
  severity: Severity;
};

export type BenchmarkLabel = {
  employee_id: string;
  point_ref: `${SectionKey}[${number}]`;
  expected: ExpectedFlag | null;
  rationale: string;
  adjudication: "human_v1";
};

const clean = (employee_id: string, point_ref: BenchmarkLabel["point_ref"], rationale: string): BenchmarkLabel => ({
  employee_id,
  point_ref,
  expected: null,
  rationale,
  adjudication: "human_v1",
});

const flagged = (
  employee_id: string,
  point_ref: BenchmarkLabel["point_ref"],
  type: FlagType,
  severity: Severity,
  rationale: string,
): BenchmarkLabel => ({
  employee_id,
  point_ref,
  expected: { type, severity },
  rationale,
  adjudication: "human_v1",
});

// Synthetic-data benchmark v1. Labels were manually adjudicated against the
// corresponding mock employee source records. They are intentionally separate
// from captured model output so the evaluator does not grade the model against
// its own predictions.
export const benchmarkLabels: BenchmarkLabel[] = [
  clean("emp_001", "strengths[0]", "Delivery timing and rollback result are corroborated by manager, goal, project, and self sources."),
  clean("emp_001", "strengths[1]", "Mentoring is corroborated by self, peer, and completed-goal evidence."),
  clean("emp_001", "strengths[2]", "The single peer source includes a concrete PR and specific prevented failure."),
  clean("emp_001", "strengths[3]", "The peer source names the session, topic, month, and attendance."),
  clean("emp_001", "growth_areas[0]", "The manager source provides a specific delegation incident and named colleague."),
  clean("emp_001", "growth_areas[1]", "The peer source quantifies the review delay and limits the claim to non-urgent PRs."),
  clean("emp_001", "growth_areas[2]", "This is accurately framed as the employee's stated development goal, not an evaluator conclusion."),
  clean("emp_001", "growth_areas[3]", "The dated meeting note directly supports the commitment."),
  clean("emp_001", "impact_highlights[0]", "Multiple objective sources support delivery date, latency, and rollback outcomes."),
  clean("emp_001", "impact_highlights[1]", "Manager, goal, and project sources corroborate the RFC and cross-team approval."),
  clean("emp_001", "impact_highlights[2]", "Manager feedback and a meeting note support the incident/runbook impact."),
  clean("emp_001", "impact_highlights[3]", "Self, peer, and goal records corroborate the mentoring activity."),
  clean("emp_001", "goal_progress[0]", "The completed goal and project outcome contain the stated measures."),
  clean("emp_001", "goal_progress[1]", "Goal completion and peer evidence support both production launches."),
  clean("emp_001", "goal_progress[2]", "Goal, project, and manager sources support approval and sign-off."),

  clean("emp_002", "strengths[0]", "Self, goal, and project records corroborate shipment and usage."),
  clean("emp_002", "strengths[1]", "The completed goal and project outcome support the delivery claim."),
  clean("emp_002", "strengths[2]", "Peer feedback and a meeting note support the June coverage and risk escalation."),
  flagged("emp_002", "growth_areas[0]", "single_source_bias", "high", "A harmful character judgment relies on one manager and supplies no concrete incident."),
  flagged("emp_002", "growth_areas[1]", "contradiction", "high", "One delayed release is generalized into consistent lateness despite contrary delivery and peer evidence."),
  flagged("emp_002", "growth_areas[2]", "vague_language", "low", "The requested proactivity and communication improvements contain no example or observable behavior."),
  clean("emp_002", "growth_areas[3]", "The claim is narrowly framed and supported by self, project, and meeting-note context."),
  clean("emp_002", "impact_highlights[0]", "Usage and time-saving impact are supported across self, peer, and project records."),
  clean("emp_002", "impact_highlights[1]", "Goal and project sources support date, adoption, and reduced duplication."),
  clean("emp_002", "goal_progress[0]", "The completed goal and project outcome support launch date and usage."),
  clean("emp_002", "goal_progress[1]", "Goal and project records support the on-time component-library delivery."),
  clean("emp_002", "goal_progress[2]", "The in-progress goal directly states the achieved reduction and remaining work."),

  flagged("emp_003", "strengths[0]", "vague_language", "medium", "Generic praise is repeated across self and manager sources but contains no observable example."),
  flagged("emp_003", "strengths[1]", "single_source_bias", "medium", "A subjective attitude judgment rests on one manager source with no concrete behavior."),
  clean("emp_003", "strengths[2]", "The source provides an observable delivery behavior: reports arrive on time."),
  flagged("emp_003", "strengths[3]", "vague_language", "low", "The Q2 setting is named, but 'helpful and flexible' lacks an action or outcome."),
  clean("emp_003", "growth_areas[0]", "The goal record directly supports status and workshop attendance."),
  clean("emp_003", "growth_areas[1]", "The meeting note directly supports both the interest and lack of a plan."),
  clean("emp_003", "impact_highlights[0]", "Peer and project sources support dashboard adoption and cadence."),
  clean("emp_003", "impact_highlights[1]", "Peer and project sources quantify the automated process and time saving."),
  clean("emp_003", "impact_highlights[2]", "The claim faithfully reports the limited project outcome without amplifying it."),
  clean("emp_003", "goal_progress[0]", "The completed goal record supports dashboard delivery."),
  clean("emp_003", "goal_progress[1]", "The in-progress goal record supports workshop attendance."),
  clean("emp_003", "goal_progress[2]", "The project and completed goal support quarterly reporting delivery."),
];
