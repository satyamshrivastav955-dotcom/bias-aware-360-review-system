// Run with: npx tsx lib/sources.test.ts   (or node --experimental-strip-types)
import assert from "node:assert";
import { employees, getEmployee } from "../data/employees";
import { mockReport } from "../data/mock-report";
import { buildSourceMap, resolveSource } from "./sources";
import { SECTIONS } from "./types";

const emp = getEmployee("emp_002")!;
const map = buildSourceMap(emp);

// Every id-bearing input item is reachable.
for (const f of [...emp.manager_feedback, ...emp.peer_feedback])
  assert.equal(map[f.id].text, f.text, `${f.id} text mismatch`);
for (const g of emp.goals) assert.ok(map[g.id].text.includes(g.goal));
for (const p of emp.project_outcomes) assert.ok(map[p.id].text.includes(p.project));

// The two ids schema v1.0 omits.
assert.equal(map.self_assessment.text, emp.self_assessment);
assert.equal(map.meeting_note_1.text, emp.meeting_notes[0]);
assert.equal(map[`meeting_note_${emp.meeting_notes.length}`].kind, "meeting");

// A citation with no matching source degrades instead of throwing.
const ghost = resolveSource(map, "manager_A_99");
assert.equal(ghost.kind, "unresolved");
assert.equal(ghost.id, "manager_A_99");

// Ids are unique within an employee — a collision would silently drop a source.
for (const e of employees) {
  const ids = [
    ...e.manager_feedback,
    ...e.peer_feedback,
    ...e.goals,
    ...e.project_outcomes,
  ].map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, `duplicate id in ${e.employee_id}`);
}

// Fixtures must cite reachable sources, except the one planted dangler that
// exercises the unresolved path during the demo.
const dangling: string[] = [];
for (const e of employees) {
  const r = mockReport(e.employee_id)!;
  const m = buildSourceMap(e);
  for (const { key } of SECTIONS)
    for (const c of r[key])
      for (const sid of c.source_ids)
        if (!m[sid]) dangling.push(`${e.employee_id}:${sid}`);
}
assert.deepEqual(dangling, ["emp_002:manager_A_3"], `unexpected dangling: ${dangling}`);

console.log("sources: ok");
