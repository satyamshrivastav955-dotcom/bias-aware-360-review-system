// One-off migration: make Workflow A consume feedback submitted through /submit.
// The request is still validated by the Next.js proxy; this node normalizes the
// entries into the same source shape used by seeded employee data.
const fs = require("node:fs");

const path = "n8n-workflows/generate-review.json";
const workflow = JSON.parse(fs.readFileSync(path, "utf8"));
const node = workflow.nodes.find((item) => item.name === "Build synthesis prompt");
if (!node) throw new Error("Build synthesis prompt node not found");
if (node.parameters.jsCode.includes("manualFeedback")) {
  console.log("manual feedback input already present");
  process.exit(0);
}

const old = "const d = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data;";
const replacement = `const base = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data;
const body = $('Webhook generate-review').first().json.body || {};
const manualFeedback = Array.isArray(body.extra_feedback) ? body.extra_feedback : [];
const normalizedManual = manualFeedback.map((f, i) => ({
  id: String(f.id || \`manual_\${f.kind || 'manager'}_\${i + 1}\`),
  reviewer: String(f.reviewer).trim(),
  text: String(f.text).trim(),
  date: String(f.date),
  kind: f.kind === 'peer' ? 'peer' : 'manager'
}));
const d = {
  ...base,
  self_assessment: typeof body.self_assessment === 'string' && body.self_assessment.trim()
    ? body.self_assessment.trim()
    : base.self_assessment,
  manager_feedback: [...(base.manager_feedback || []), ...normalizedManual.filter(f => f.kind === 'manager')],
  peer_feedback: [...(base.peer_feedback || []), ...normalizedManual.filter(f => f.kind === 'peer')]
};`;

if (!node.parameters.jsCode.includes(old)) throw new Error("expected source merge line not found");
node.parameters.jsCode = node.parameters.jsCode.replace(old, replacement);
fs.writeFileSync(path, JSON.stringify(workflow, null, 2) + "\n");
console.log("added manual feedback input to Workflow A");
