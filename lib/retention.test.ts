import assert from "node:assert/strict";
import { RETENTION_MONTHS, retentionStatus } from "./retention";

const at = (d: string) => new Date(`${d}T00:00:00Z`);

// The window is months, so the expiry lands on the same day of the month.
const plain = retentionStatus("2026-08-02T10:00:00Z", at("2026-08-02"))!;
assert.equal(plain.expiresOn, "2028-08-02");
assert.equal(plain.expired, false);

// A leap day cannot expire on 29 February in a non-leap year. Clamping to the
// 28th keeps the date real; rolling into March would silently extend the window.
assert.equal(
  retentionStatus("2024-02-29T00:00:00Z", at("2024-03-01"))!.expiresOn,
  "2026-02-28",
);

// The last day inside the window still counts as inside it. Without date-level
// comparison a report would read as expired for the whole of its final day.
const lastDay = retentionStatus("2024-08-02T23:00:00Z", at("2026-08-01"))!;
assert.equal(lastDay.daysRemaining, 1);
assert.equal(lastDay.expired, false);

const past = retentionStatus("2020-01-01T00:00:00Z", at("2026-08-02"))!;
assert.equal(past.expired, true);
assert.ok(past.daysRemaining < 0);

// A malformed timestamp must not be reported as a valid retention window —
// showing a wrong expiry date is worse than showing none.
assert.equal(retentionStatus("not a date"), null);

assert.equal(RETENTION_MONTHS, 24);

console.log("retention: ok");
