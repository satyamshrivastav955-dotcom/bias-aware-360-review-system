import { buildSourceMap } from "./sources";
import {
  SECTIONS,
  type Employee,
  type Report,
  type Severity,
  type Source,
} from "./types";

export function flagCounts(report: Report | null): Record<Severity, number> {
  const c: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  if (!report) return c;
  for (const { key } of SECTIONS)
    for (const claim of report[key]) if (claim.flag) c[claim.flag.severity]++;
  return c;
}

export const totalFlags = (c: Record<Severity, number>) =>
  c.high + c.medium + c.low;

export const claims = (report: Report) =>
  SECTIONS.flatMap(({ key }) => report[key]);

export type Ledger = {
  sourcesOnFile: number;
  sourcesCited: number;
  claimsTotal: number;
  claimsWithoutCitation: number;
  unresolvedCitations: string[];
};

// The grounding claim, stated as something a judge can check: every id a claim
// cites either resolves to text in the employee file or is named here.
export function evidenceLedger(
  report: Report,
  sourceMap: Record<string, Source>,
): Ledger {
  const all = claims(report);
  const cited = new Set(all.flatMap((c) => c.source_ids));
  return {
    sourcesOnFile: Object.keys(sourceMap).length,
    sourcesCited: [...cited].filter((id) => sourceMap[id]).length,
    claimsTotal: all.length,
    claimsWithoutCitation: all.filter((c) => c.source_ids.length === 0).length,
    unresolvedCitations: [...cited].filter((id) => !sourceMap[id]),
  };
}

export type Contributor = {
  reviewer: string;
  kinds: Source["kind"][];
  entries: number;
  share: number; // 0-1 of all attributed feedback entries
  first: string | null;
  last: string | null;
};

// Who actually spoke into this review, and how much of it each one is. Entry
// counts and date ranges are the honest analogue of a "reviewer score" — there
// is no rating anywhere in the data.
export function contributors(e: Employee): Contributor[] {
  // The self-assessment carries the employee's own name as its reviewer.
  // Counting it would put the subject in their own reviewer pool and dilute
  // every share — the pre-check reads 75% for Arjun's manager, and this must
  // agree with it rather than quietly reporting 60%.
  const attributed = Object.values(buildSourceMap(e)).filter(
    (s) => s.reviewer && s.kind !== "self",
  );
  const by = new Map<string, Contributor>();

  for (const s of attributed) {
    const key = s.reviewer!;
    const row = by.get(key) ?? {
      reviewer: key,
      kinds: [],
      entries: 0,
      share: 0,
      first: null,
      last: null,
    };
    row.entries++;
    if (!row.kinds.includes(s.kind)) row.kinds.push(s.kind);
    // Dates are "YYYY-MM" strings, never parsed — lexical order is enough.
    if (s.date) {
      if (!row.first || s.date < row.first) row.first = s.date;
      if (!row.last || s.date > row.last) row.last = s.date;
    }
    by.set(key, row);
  }

  const total = attributed.length || 1;
  return [...by.values()]
    .map((r) => ({ ...r, share: r.entries / total }))
    .sort((a, b) => b.entries - a.entries);
}

export const pct = (n: number) => `${Math.round(n * 100)}%`;
