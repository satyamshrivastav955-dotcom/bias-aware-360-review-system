import type { Employee } from "./types";

export type EvidenceCounts = {
  self_assessment: number;
  manager_feedback: number;
  peer_feedback: number;
  goals: number;
  project_outcomes: number;
  meeting_notes: number;
};

export type EvidenceAssessment = {
  insufficient: boolean;
  missing: string[];
  evidence: EvidenceCounts;
};

// Deterministic and independent of the model. The n8n workflow mirrors this
// check before its first Gemini call.
export function assessEvidence(e: Employee): EvidenceAssessment {
  const evidence: EvidenceCounts = {
    self_assessment: e.self_assessment ? 1 : 0,
    manager_feedback: e.manager_feedback.length,
    peer_feedback: e.peer_feedback.length,
    goals: e.goals.length,
    project_outcomes: e.project_outcomes.length,
    meeting_notes: e.meeting_notes.length,
  };
  const missing = ["manager_feedback", "peer_feedback", "goals", "project_outcomes"].filter(
    (key) => evidence[key as keyof EvidenceCounts] === 0,
  );
  return {
    insufficient:
      evidence.manager_feedback + evidence.peer_feedback < 2 ||
      evidence.goals + evidence.project_outcomes < 1,
    missing,
    evidence,
  };
}
