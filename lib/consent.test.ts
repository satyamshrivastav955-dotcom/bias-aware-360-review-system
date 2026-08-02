// Run with: npx tsx lib/consent.test.ts
import assert from "node:assert";
import { employees, getEmployee } from "../data/employees";
import { employeeSchema } from "./schemas";

// Consent is a first-class field on every seeded employee record, and each
// parses through the employee schema on import (data/employees.ts).
for (const e of employees) {
  assert.ok(e.consent, `${e.employee_id} has no consent`);
  assert.equal(e.consent!.scope, "360_review");
}

// emp_004 is the new joiner — not yet consented is the honest state, and the
// absent date records that it was never granted rather than being lost.
const riya = getEmployee("emp_004")!;
assert.equal(riya.consent!.granted, false);
assert.equal(riya.consent!.granted_at, null);

// An impossible date is rejected.
const base = {
  employee_id: "emp_005",
  name: "Test Employee",
  role: "Engineer",
  self_assessment: "",
  manager_feedback: [],
  peer_feedback: [],
  goals: [],
  project_outcomes: [],
  meeting_notes: [],
};

assert.equal(
  employeeSchema.safeParse({
    ...base,
    consent: {
      granted: true,
      granted_at: "2026-13-99",
      scope: "360_review",
      basis: "employment_contract",
    },
  }).success,
  false,
);

// A scope other than 360_review is rejected.
assert.equal(
  employeeSchema.safeParse({
    ...base,
    consent: {
      granted: true,
      granted_at: "2026-01-01",
      scope: "annual_review",
      basis: "explicit_opt_in",
    },
  }).success,
  false,
);

console.log("consent: ok");
