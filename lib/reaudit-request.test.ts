import assert from "node:assert/strict";
import { parseVerdict } from "./reaudit";
import { reauditRequestSchema } from "./schemas";

// Only the sentence travels. A body carrying an employee id or a name would
// send identifying data to a third provider for a question that does not need
// it, so the schema refuses anything beyond the two known fields.
const ok = reauditRequestSchema.safeParse({
  text: "Missed the 2026-03 launch date on the billing migration.",
  original_flag_type: "contradiction",
});
assert.equal(ok.success, true);

assert.equal(reauditRequestSchema.safeParse({ text: "" }).success, false);
assert.equal(reauditRequestSchema.safeParse({ text: "   " }).success, false);
assert.equal(
  reauditRequestSchema.safeParse({ text: "x".repeat(2001) }).success,
  false,
);
// An unknown flag type means the caller and the audit disagree about the
// vocabulary — better to reject than to put a made-up label in the prompt.
assert.equal(
  reauditRequestSchema.safeParse({ text: "fine", original_flag_type: "vibes" })
    .success,
  false,
);
// The flag type is optional: an unflagged claim can still be asked about.
assert.equal(reauditRequestSchema.safeParse({ text: "fine" }).success, true);

// ─── The agent's reply is untrusted input ───────────────────────────────────

// Models wrap JSON in prose and fences more often than not, so the object is
// extracted rather than the whole reply being parsed.
const fenced = parseVerdict(
  'Here is my assessment:\n```json\n{"biased": true, "severity": "high", "reasoning": "Faint praise reading as dismissal."}\n```',
);
assert.deepEqual(fenced, {
  biased: true,
  severity: "high",
  reasoning: "Faint praise reading as dismissal.",
});

// Every rejection below would otherwise render as a real verdict on someone's
// performance review. A half-read second opinion is worse than none.
assert.equal(parseVerdict("I think it is fine, no JSON here."), null);
assert.equal(parseVerdict('{"biased": true, "severity": "high"}'), null); // no reasoning
assert.equal(parseVerdict('{"biased": true, "reasoning": "x"}'), null); // no severity
assert.equal(
  parseVerdict('{"biased": "yes", "severity": "high", "reasoning": "x"}'),
  null,
); // biased must be a boolean, not the string "yes"
assert.equal(
  parseVerdict('{"biased": false, "severity": "critical", "reasoning": "x"}'),
  null,
); // severity outside the vocabulary the UI can colour
assert.equal(
  parseVerdict('{"biased": false, "severity": "low", "reasoning": "   "}'),
  null,
); // blank reasoning is not a reason
assert.equal(parseVerdict('{"biased": true, severity: broken'), null);

// A model that runs on is truncated rather than allowed to blow out the row.
const long = parseVerdict(
  `{"biased": false, "severity": "low", "reasoning": "${"a".repeat(900)}"}`,
);
assert.equal(long!.reasoning.length, 600);

console.log("reaudit-request: ok");