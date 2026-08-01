import type { Employee, Source } from "./types";

// ponytail: meeting_notes and self_assessment have no ids in schema v1.0.
// Convention pinned here — backend must emit the same: `self_assessment`
// and `meeting_note_{1-based index}`.
export function buildSourceMap(e: Employee): Record<string, Source> {
  const m: Record<string, Source> = {};
  const put = (s: Source) => {
    m[s.id] = s;
  };

  put({
    id: "self_assessment",
    kind: "self",
    reviewer: e.name,
    text: e.self_assessment,
    date: null,
  });

  for (const f of e.manager_feedback)
    put({
      id: f.id,
      kind: "manager",
      reviewer: f.reviewer,
      text: f.text,
      date: f.date,
    });

  for (const f of e.peer_feedback)
    put({
      id: f.id,
      kind: "peer",
      reviewer: f.reviewer,
      text: f.text,
      date: f.date,
    });

  for (const g of e.goals)
    put({
      id: g.id,
      kind: "goal",
      reviewer: null,
      date: null,
      text: `${g.goal}\n\nStatus: ${g.status.replace("_", " ")}\nEvidence: ${g.evidence}`,
    });

  for (const p of e.project_outcomes)
    put({
      id: p.id,
      kind: "project",
      reviewer: null,
      date: null,
      text: `${p.project}\n\nOutcome: ${p.outcome}`,
    });

  e.meeting_notes.forEach((t, i) =>
    put({
      id: `meeting_note_${i + 1}`,
      kind: "meeting",
      reviewer: null,
      text: t,
      date: null,
    }),
  );

  return m;
}

// An id the report cites but the input file doesn't contain is itself an audit
// finding — surface it rather than crashing.
export function resolveSource(
  map: Record<string, Source>,
  id: string,
): Source {
  return (
    map[id] ?? {
      id,
      kind: "unresolved",
      reviewer: null,
      date: null,
      text: "This citation does not match any source in the employee input file. The claim cannot be verified against the evidence provided.",
    }
  );
}

export const KIND_LABEL: Record<Source["kind"], string> = {
  self: "Self-assessment",
  manager: "Manager feedback",
  peer: "Peer feedback",
  goal: "Stated goal",
  project: "Project outcome",
  meeting: "Meeting note",
  unresolved: "Unresolved citation",
};
