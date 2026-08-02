import assert from "node:assert/strict";
import { biasPrecheck, raisedCount } from "./bias-precheck";
import { mockReport } from "../data/mock-report";
import { employees, getEmployee } from "../data/employees";
import { buildSourceMap } from "./sources";
import { contributors, evidenceLedger, flagCounts } from "./stats";

const emp = (id: string) => getEmployee(id)!;
const report = (id: string) => mockReport(id)!;

// Every number the dashboard shows comes from these three functions. If one
// silently returns zero, six pages render a plausible-looking lie — which is
// exactly the failure this project is judged on.
async function main() {
  // Measured by hand from data/mock_reports/emp_002.json: two high, one low.
  assert.deepEqual(flagCounts(report("emp_002")), { high: 2, medium: 0, low: 1 });
  assert.deepEqual(flagCounts(report("emp_001")), { high: 0, medium: 0, low: 0 });
  assert.deepEqual(flagCounts(null), { high: 0, medium: 0, low: 0 });

  for (const e of employees) {
    const led = evidenceLedger(report(e.employee_id), buildSourceMap(e));
    assert.equal(led.claimsWithoutCitation, 0, `${e.employee_id} has an uncited claim`);
    assert.deepEqual(led.unresolvedCitations, [], `${e.employee_id} cites a missing source`);
    assert.ok(led.sourcesCited > 0 && led.sourcesCited <= led.sourcesOnFile);
  }

  // Arjun's file is 3 manager entries from one person against 1 peer entry.
  const top = contributors(emp("emp_002"))[0];
  assert.equal(top.reviewer, "Manager A (Sanjay Kulkarni)");
  assert.equal(top.entries, 3);

  // The pre-check must separate the demo employee from the other two without
  // any model involved — that is the whole point of it.
  assert.equal(raisedCount(biasPrecheck(emp("emp_002"))), 3);
  assert.equal(raisedCount(biasPrecheck(emp("emp_001"))), 0);
  assert.equal(raisedCount(biasPrecheck(emp("emp_003"))), 0);

  const conc = biasPrecheck(emp("emp_002")).find((s) => s.id === "concentration")!;
  assert.match(conc.detail, /75%/);

  console.log("stats: ok");
}

main();
