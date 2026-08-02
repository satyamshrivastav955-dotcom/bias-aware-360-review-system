import assert from "node:assert/strict";
import emp001 from "../data/mock_employees/emp_001_priya_sharma.json";
import report001 from "../data/mock_reports/emp_001.json";
import {
  approveRequestSchema,
  employeeSchema,
  reportSchema,
  serverAuditEntrySchema,
} from "./schemas";

employeeSchema.parse(emp001);
reportSchema.parse({
  ...report001,
  created_at: new Date(0).toISOString(),
  audit_status: "complete",
  stripped_uncited_count: 0,
});

assert.equal(
  approveRequestSchema.safeParse({
    report_id: "report-1",
    action: "approve",
    reviewer: "Manager",
  }).success,
  false,
);

assert.equal(
  reportSchema.safeParse({
    ...report001,
    strengths: [{ text: "No source", source_ids: [], flag: null }],
    created_at: new Date(0).toISOString(),
  }).success,
  false,
);

assert.equal(
  serverAuditEntrySchema.safeParse({
    id: 1,
    report_id: "report-1",
    employee_id: "emp_001",
    actor: "Manager",
    action: "approved",
    at: new Date(0).toISOString(),
    report_status: "approved",
    diff: null,
  }).success,
  true,
);

console.log("schemas: ok");
