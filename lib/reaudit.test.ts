// Run with: npx tsx lib/reaudit.test.ts
import assert from "node:assert";
import { reauditClaim, raisedCount } from "./reaudit";

const raised = (text: string) => reauditClaim(text).filter((s) => s.raised).map((s) => s.id);
const flag = (id: string) => (text: string) =>
  reauditClaim(text).find((s) => s.id === id)!.raised;

// Editing a flagged claim back into obviously biased wording raises the tell.
assert.deepEqual(raised("she is always abrasive"), [
  "personality",
  "absolute",
  "anchor",
]);
assert.ok(flag("personality")("She has been very aggressive in meetings."));

// Evidence-anchored rewording clears every check.
assert.deepEqual(raised("She shipped the analytics dashboard in March, used by 40+ internal users daily."), []);
assert.deepEqual(raised("He flagged the release risk to QA a week early and re-scoped the sprint."), []);

// An absolute sweep is flagged even when the claim is otherwise anchored.
assert.deepEqual(raised("He always resolved the June release on time."), ["absolute"]);

// Appearance / demographic descriptors are flagged.
assert.ok(flag("appearance")("She looks younger than her peers and dresses well."));

// A bare character judgment with no anchor is vague.
assert.deepEqual(raised("He is a good communicator."), ["anchor"]);

// "may" as a modal verb is not read as the month, so a vague claim stays vague.
assert.deepEqual(raised("She may improve her communication."), ["anchor"]);

// refs expose the matched terms so the detector is inspectable.
const s = reauditClaim("she is always abrasive");
assert.ok(s.find((x) => x.id === "personality")!.refs.includes("abrasive"));
assert.ok(s.find((x) => x.id === "absolute")!.refs.includes("always"));
assert.equal(raisedCount(reauditClaim("she is always abrasive")), 3);
assert.equal(raisedCount(reauditClaim("She shipped the dashboard in March, used by 40+ users daily.")), 0);

console.log("reaudit: ok");
