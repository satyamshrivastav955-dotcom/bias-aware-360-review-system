import assert from "node:assert/strict";
import { benchmarkLabels } from "../data/evaluation/benchmark";
import { employees } from "../data/employees";
import { mockReport } from "../data/mock-report";
import { evaluateCapturedReports, predictionsFor } from "./evaluation";
import { claims } from "./stats";

const refs = new Set(benchmarkLabels.map((label) => `${label.employee_id}:${label.point_ref}`));
assert.equal(refs.size, benchmarkLabels.length, "benchmark point references must be unique");

for (const employee of employees) {
  const report = mockReport(employee.employee_id);
  const labels = benchmarkLabels.filter((label) => label.employee_id === employee.employee_id);
  // Employee C is intentionally refused by the evidence gate, so it has no
  // captured report and should not enter the captured-report benchmark.
  if (!report) {
    assert.equal(labels.length, 0, `${employee.employee_id} has benchmark labels but no report`);
    continue;
  }
  assert.equal(labels.length, claims(report).length, `${employee.employee_id} must label every report claim`);
  assert.equal(predictionsFor(report, labels).length, labels.length);
}

const result = evaluateCapturedReports();
assert.equal(result.claims, benchmarkLabels.length);
assert.equal(result.auditCompleteness, 1);
assert.equal(result.citationResolution, 1);
assert.equal(result.overall.falsePositiveRate, 0);
assert.ok(result.overall.f1 >= 0.8, `captured overall F1 regressed to ${result.overall.f1}`);
assert.ok(
  result.disagreements.some((row) => row.employee_id === "emp_003" && row.point_ref === "strengths[0]"),
  "known vague-praise false negative must remain visible until the captured output is improved",
);

console.log("evaluation: ok");
