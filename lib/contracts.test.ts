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

console.log("contracts: ok");
