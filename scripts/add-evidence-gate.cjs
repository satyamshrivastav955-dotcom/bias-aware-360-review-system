// One-off migration: adds the deterministic evidence gate to Workflow A.
// Inserts gate computation into "Build synthesis prompt", adds an IF branch
// plus a Respond node for the insufficient_evidence reply, and rewires
// "Employee found?" -> "Evidence sufficient?" -> Synthesis Agent.
const fs = require("fs");
const p = "n8n-workflows/generate-review.json";
const w = JSON.parse(fs.readFileSync(p, "utf8"));

const prompt = w.nodes.find((n) => n.id === "code-prompt");
if (!prompt) throw new Error("code-prompt node not found");
if (prompt.parameters.jsCode.includes("insufficient")) {
  console.log("gate already present, aborting");
  process.exit(1);
}

const gate = `
// Deterministic evidence gate — runs before any model call. A fair 360 review
// needs at least two independent reviewer voices and at least one objective
// record (a goal or a project outcome). Below that, decline to draft: anything
// the model produced would be invention, not synthesis.
const evidence = {
  self_assessment: d.self_assessment ? 1 : 0,
  manager_feedback: (d.manager_feedback || []).length,
  peer_feedback: (d.peer_feedback || []).length,
  goals: (d.goals || []).length,
  project_outcomes: (d.project_outcomes || []).length,
  meeting_notes: (d.meeting_notes || []).length
};
const missing = ['manager_feedback', 'peer_feedback', 'goals', 'project_outcomes'].filter(k => evidence[k] === 0);
const insufficient = (evidence.manager_feedback + evidence.peer_feedback) < 2
  || (evidence.goals + evidence.project_outcomes) < 1;
`;

const anchor = "const validIds = sources.map(s => s.source_id);";
if (!prompt.parameters.jsCode.includes(anchor)) throw new Error("anchor not found");
prompt.parameters.jsCode = prompt.parameters.jsCode.replace(anchor, anchor + "\n" + gate);

const oldReturn =
  "return [{ json: { ok: true, employee_id: d.employee_id, name: d.name, role: d.role, prompt, sources, validIds } }];";
const newReturn =
  "return [{ json: { ok: true, insufficient, missing, evidence, employee_id: d.employee_id, name: d.name, role: d.role, prompt, sources, validIds } }];";
if (!prompt.parameters.jsCode.includes(oldReturn)) throw new Error("return anchor not found");
prompt.parameters.jsCode = prompt.parameters.jsCode.replace(oldReturn, newReturn);

// IF node: sufficient evidence continues to the Synthesis Agent.
w.nodes.push({
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
      conditions: [
        {
          id: "sufficient",
          leftValue: "={{ $json.insufficient }}",
          rightValue: "={{ false }}",
          operator: { type: "boolean", operation: "false", singleValue: true },
        },
      ],
      combinator: "and",
    },
    options: {},
  },
  id: "if-sufficient",
  name: "Evidence sufficient?",
  type: "n8n-nodes-base.if",
  typeVersion: 2.2,
  position: [-460, 100],
});

// Respond node: the refusal, with what is missing. HTTP 200 — this is a
// successful evaluation, not an error. No model was called, nothing persisted.
w.nodes.push({
  parameters: {
    respondWith: "json",
    responseBody:
      "={{ JSON.stringify({ ok: true, status: 'insufficient_evidence', employee_id: $json.employee_id, name: $json.name, role: $json.role, message: 'Not enough independent feedback on file to draft a fair, evidence-grounded review. No report was generated and no AI output was invented.', missing: $json.missing, evidence: $json.evidence }) }}",
    options: {},
  },
  id: "respond-insufficient",
  name: "Respond insufficient evidence",
  type: "n8n-nodes-base.respondToWebhook",
  typeVersion: 1.1,
  position: [-240, 260],
});

// Rewire: Employee found? true -> Evidence sufficient? (was Synthesis Agent).
w.connections["Employee found?"].main[0] = [
  { node: "Evidence sufficient?", type: "main", index: 0 },
];
w.connections["Evidence sufficient?"] = {
  main: [
    [{ node: "Synthesis Agent (Gemini)", type: "main", index: 0 }],
    [{ node: "Respond insufficient evidence", type: "main", index: 0 }],
  ],
};

JSON.parse(fs.readFileSync(p, "utf8")); // sanity on the original parse path
fs.writeFileSync(p, JSON.stringify(w, null, 2) + "\n");
console.log("gate added, nodes:", w.nodes.length);
