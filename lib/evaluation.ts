import { benchmarkLabels, type BenchmarkLabel } from "@/data/evaluation/benchmark";
import { employees } from "@/data/employees";
import { mockReport } from "@/data/mock-report";
import { buildSourceMap } from "@/lib/sources";
import { claims, evidenceLedger } from "@/lib/stats";
import { FLAG_TYPES } from "@/lib/schemas";
import { pointRef, SECTIONS, type Flag, type FlagType, type Report } from "@/lib/types";

export type Prediction = BenchmarkLabel & { actual: Flag | null };

export type BinaryMetrics = {
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  trueNegative: number;
  precision: number;
  recall: number;
  f1: number;
  falsePositiveRate: number;
};

const ratio = (numerator: number, denominator: number) =>
  denominator === 0 ? 0 : numerator / denominator;

export function binaryMetrics(rows: Prediction[]): BinaryMetrics {
  let truePositive = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  let trueNegative = 0;
  for (const row of rows) {
    const expected = row.expected !== null;
    const actual = row.actual !== null;
    if (expected && actual) truePositive++;
    else if (!expected && actual) falsePositive++;
    else if (expected) falseNegative++;
    else trueNegative++;
  }
  const precision = ratio(truePositive, truePositive + falsePositive);
  const recall = ratio(truePositive, truePositive + falseNegative);
  return {
    truePositive,
    falsePositive,
    falseNegative,
    trueNegative,
    precision,
    recall,
    f1: precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall),
    falsePositiveRate: ratio(falsePositive, falsePositive + trueNegative),
  };
}

export function categoryMetrics(rows: Prediction[], type: FlagType): BinaryMetrics {
  const remapped = rows.map((row) => ({
    ...row,
    expected: row.expected?.type === type ? row.expected : null,
    actual: row.actual?.type === type ? row.actual : null,
  }));
  return binaryMetrics(remapped);
}

export function predictionsFor(report: Report, labels: BenchmarkLabel[]): Prediction[] {
  const byRef = new Map<string, Flag | null>();
  for (const { key } of SECTIONS) {
    report[key].forEach((claim, index) => byRef.set(pointRef(key, index), claim.flag));
  }
  return labels.map((label) => ({ ...label, actual: byRef.get(label.point_ref) ?? null }));
}

export type EvaluationSummary = {
  benchmarkVersion: "human_v1";
  source: "captured synthetic reports";
  employees: number;
  claims: number;
  expectedFlagged: number;
  actualFlagged: number;
  overall: BinaryMetrics;
  exactTypeAccuracy: number;
  severityAccuracy: number;
  auditCompleteness: number;
  citationResolution: number;
  macroF1: number;
  byType: { type: FlagType; support: number; metrics: BinaryMetrics }[];
  disagreements: Prediction[];
};

export function evaluateCapturedReports(): EvaluationSummary {
  const rows: Prediction[] = [];
  let audited = 0;
  let reportClaims = 0;
  let cited = 0;
  let unresolved = 0;

  for (const employee of employees) {
    const report = mockReport(employee.employee_id);
    if (!report) continue;
    const labels = benchmarkLabels.filter((label) => label.employee_id === employee.employee_id);
    rows.push(...predictionsFor(report, labels));
    const count = claims(report).length;
    reportClaims += count;
    audited += report.audit_status === "complete" ? report.audited_claims ?? count : 0;
    const ledger = evidenceLedger(report, buildSourceMap(employee));
    cited += count - ledger.claimsWithoutCitation;
    unresolved += ledger.unresolvedCitations.length;
  }

  const expectedFlagged = rows.filter((row) => row.expected).length;
  const actualFlagged = rows.filter((row) => row.actual).length;
  const bothFlagged = rows.filter((row) => row.expected && row.actual);
  const exactTypeMatches = bothFlagged.filter((row) => row.expected?.type === row.actual?.type).length;
  const severityMatches = bothFlagged.filter((row) => row.expected?.severity === row.actual?.severity).length;
  const byType = FLAG_TYPES.map((type) => ({
    type,
    support: rows.filter((row) => row.expected?.type === type).length,
    metrics: categoryMetrics(rows, type),
  }));
  const supportedCategories = byType.filter((entry) => entry.support > 0);

  return {
    benchmarkVersion: "human_v1",
    source: "captured synthetic reports",
    employees: employees.length,
    claims: rows.length,
    expectedFlagged,
    actualFlagged,
    overall: binaryMetrics(rows),
    exactTypeAccuracy: ratio(exactTypeMatches, bothFlagged.length),
    severityAccuracy: ratio(severityMatches, bothFlagged.length),
    auditCompleteness: ratio(audited, reportClaims),
    citationResolution: ratio(cited - unresolved, reportClaims),
    macroF1: supportedCategories.length
      ? supportedCategories.reduce((sum, entry) => sum + entry.metrics.f1, 0) / supportedCategories.length
      : 0,
    byType,
    disagreements: rows.filter((row) => {
      if (!row.expected && !row.actual) return false;
      return !row.expected || !row.actual || row.expected.type !== row.actual.type || row.expected.severity !== row.actual.severity;
    }),
  };
}
