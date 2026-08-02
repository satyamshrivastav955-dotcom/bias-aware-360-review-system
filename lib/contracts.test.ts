import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FLAG_TYPES } from "./schemas";

const root = process.cwd();
const read = (file: string) =>
  fs.readFileSync(path.join(root, file), "utf8").replace(/^\uFEFF/, "");
const synthesisPrompt = read("prompts/synthesis_agent.txt");
const biasPrompt = read("prompts/bias_detection_agent.txt");
const pipeline = read("scripts/test_pipeline.sh");
const generateWorkflow = JSON.parse(read("n8n-workflows/generate-review.json"));
const approveWorkflow = JSON.parse(read("n8n-workflows/approve-review.json"));
const acknowledgeWorkflow = JSON.parse(read("n8n-workflows/acknowledge.json"));
const eraseWorkflow = JSON.parse(read("n8n-workflows/erase-employee-data.json"));

assert.match(synthesisPrompt, /self_1/);
assert.match(synthesisPrompt, /note_1/);
assert.doesNotMatch(synthesisPrompt, /"self_assessment"/);
assert.doesNotMatch(synthesisPrompt, /meeting_note_1/);

for (const type of FLAG_TYPES) assert.match(biasPrompt, new RegExp(type));
assert.doesNotMatch(pipeline, /"action": "approve"/);
assert.match(pipeline, /(?:\\?"action\\?":\s*\\?"approved\\?")/);
assert.match(pipeline, /unresolved_high_severity_flags/);

const mergeCode = generateWorkflow.nodes.find(
  (node: { name: string }) => node.name === "Merge flags",
).parameters.jsCode as string;
assert.match(mergeCode, /Bias audit incomplete/);
assert.match(mergeCode, /duplicate point_ref/);
assert.match(mergeCode, /stripped_uncited_count/);

const guardCode = approveWorkflow.nodes.find(
  (node: { name: string }) => node.name === "Guard \+ diff",
)?.parameters.jsCode as string | undefined;
const actualGuardCode =
  guardCode ??
  (approveWorkflow.nodes.find((node: { name: string }) => node.name === "Guard + diff")
    .parameters.jsCode as string);
assert.doesNotMatch(actualGuardCode, /!editedRefs\.has\(ref\)/);
assert.match(actualGuardCode, /acknowledged_refs/);

// The acknowledge webhook must write its own audit_log row. If it ever only
// echoed success without inserting, the governance page's claim that declining
// to act is recorded would be false and nothing else here would catch it.
const ackNode = acknowledgeWorkflow.nodes.find(
  (node: { name: string }) => node.name === "Record acknowledgement",
);
assert.match(ackNode.parameters.query as string, /insert into audit_log/);
assert.match(ackNode.parameters.query as string, /'acknowledged'/);
// The insert is guarded on the report existing, so a bad report_id cannot
// plant an orphan row in the trail.
assert.match(ackNode.parameters.query as string, /exists \(select 1 from reports/);
assert.equal(
  acknowledgeWorkflow.nodes.find(
    (node: { type: string }) => node.type === "n8n-nodes-base.webhook",
  ).parameters.path,
  "acknowledge",
);

// Erasure must delete the reports and the source row, and must leave the audit
// rows standing with their contents emptied. A workflow edit that turned the
// redaction into a delete would erase the evidence that the erasure happened —
// the one thing this control exists to preserve.
const eraseQuery = eraseWorkflow.nodes.find(
  (node: { name: string }) => node.name === "Erase employee data",
).parameters.query as string;
assert.match(eraseQuery, /delete from reports where employee_id/);
assert.match(eraseQuery, /delete from employees where employee_id/);
assert.match(eraseQuery, /update audit_log set diff/);
assert.doesNotMatch(eraseQuery, /delete from audit_log/);
// The erasure writes its own trail row naming the actor and the reason.
assert.match(eraseQuery, /insert into audit_log/);
assert.match(eraseQuery, /'erased'/);
// audit_log.report_id references reports(id); leaving it set would make the
// report delete fail on the foreign key.
assert.match(eraseQuery, /report_id = null/);
assert.equal(
  eraseWorkflow.nodes.find(
    (node: { type: string }) => node.type === "n8n-nodes-base.webhook",
  ).parameters.path,
  "erase-employee-data",
);
// A reason is mandatory server-side, not just in the browser: an erasure with
// no stated ground is indistinguishable from deleting an inconvenient review.
const eraseValidator = eraseWorkflow.nodes.find(
  (node: { name: string }) => node.name === "Validate erase request",
).parameters.jsCode as string;
assert.match(eraseValidator, /invalid_reason/);
assert.match(eraseValidator, /subject_request/);
assert.match(eraseValidator, /retention_expired/);

console.log("contracts: ok");