import { pct } from "./stats";
import type { Employee, Feedback } from "./types";

// known-limitation: heuristics, not science. These thresholds separate the three
// employees in data/ the way a human reading the files would; they are stated
// so a reviewer can disagree with them, not presented as a measurement.
const T = {
  concentration: 0.6, // one voice supplying more than 60% of attributed feedback
  minMonths: 3, // a review cycle observed across fewer months than this is a snapshot
  minPeerVoices: 2,
};

export type Signal = {
  id: "concentration" | "window" | "voice";
  label: string;
  detail: string;
  refs: string[];
  raised: boolean;
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

const largest = (feedback: Feedback[]) => {
  const by = new Map<string, Feedback[]>();
  for (const f of feedback) by.set(f.reviewer, [...(by.get(f.reviewer) ?? []), f]);
  return [...by.values()].sort((a, b) => b.length - a.length)[0] ?? [];
};

// Runs on the input file alone — no model, no network. This is the second,
// independently verifiable bias signal: the LLM audit judges the draft's
// wording, this judges whether the evidence behind it is balanced at all.
export function biasPrecheck(e: Employee): Signal[] {
  const feedback = [...e.manager_feedback, ...e.peer_feedback];
  const top = largest(feedback);
  const concentration = feedback.length ? top.length / feedback.length : 0;

  // Dates are "YYYY-MM" strings, never parsed — lexical order is enough.
  const months = [...new Set(feedback.map((f) => f.date).filter(Boolean))].sort();
  const newest = months[months.length - 1] ?? "";
  const inNewest = feedback.filter((f) => f.date === newest);

  const peerVoices = new Set(e.peer_feedback.map((f) => f.reviewer)).size;

  return [
    {
      id: "concentration",
      label: "Source concentration",
      raised: concentration > T.concentration,
      detail: top.length
        ? `${pct(concentration)} of the ${feedback.length} feedback entries on file come from one person — ${top[0].reviewer}.`
        : "No attributed feedback is on file.",
      refs: top.map((f) => f.id),
    },
    {
      id: "window",
      label: "Observation window",
      raised: months.length > 0 && months.length < T.minMonths,
      detail: months.length
        ? `All ${feedback.length} entries were written across ${months.length} ${plural(months.length, "month", "months")} (${months[0]} to ${newest}); ${inNewest.length} of them in ${newest} alone.`
        : "No feedback entry carries a date.",
      refs: inNewest.map((f) => f.id),
    },
    {
      id: "voice",
      label: "Voice balance",
      raised: peerVoices < T.minPeerVoices,
      detail: `${e.manager_feedback.length} manager ${plural(e.manager_feedback.length, "entry", "entries")}, ${e.peer_feedback.length} peer ${plural(e.peer_feedback.length, "entry", "entries")} from ${peerVoices} ${plural(peerVoices, "person", "people")}, 1 self-assessment.`,
      refs: e.peer_feedback.map((f) => f.id),
    },
  ];
}

export const raisedCount = (s: Signal[]) => s.filter((x) => x.raised).length;
