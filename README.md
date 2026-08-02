TEAM NAME: CLAUDE'S PLAN

# bias-aware-360-review-system

Scattered 360° feedback in, an evidence-cited performance review out — every claim traceable to the sentence it came from, every draft audited for bias before a human can approve it.

Built for Innova Hack Chapter-1 (Agentic AI track). Next.js App Router on Vercel; n8n Cloud + Gemini for the agent pipeline. No custom backend server.

## The flow

1. **Collect** — self-assessment, manager notes and peer feedback for one employee, each entry addressable by a source id (`peer_1`, `mgr_2`, …).
2. **Draft** — an agent synthesises strengths, growth areas and achievements. Every claim carries `source_ids`; the UI resolves each one back to the original text in a drawer.
3. **Audit** — a second pass flags claims for single-source bias, contradiction, vague language and unsupported praise, each with a severity and written reasoning.
4. **Decide** — the reviewer edits any claim, acknowledges the flags they disagree with, then approves or rejects. Approval is refused while a high-severity flag is neither edited nor acknowledged.
5. **Record** — actor, action, timestamp and a field-level diff of every edit land in the audit trail.

## Evidence grounding

The review page states the grounding claim as a number you can check: *"13 of 13 sources on file cited · 0 claims without a citation."* A claim citing an id that resolves to nothing is counted and named, not hidden. Computed in `lib/stats.ts`.

## Bias detection, twice

The model's audit is one signal. Because a prompt is not something a judge can verify — and because a model that is down produces no flags at all — the review page also runs a **deterministic pre-check** (`lib/bias-precheck.ts`) over the raw input file, before anything is generated:

- **Source concentration** — the share of feedback coming from one person.
- **Observation window** — how many distinct months the feedback spans, and how much of it lands in the newest one.
- **Voice balance** — manager / peer / self entry counts, and how many distinct peers.

Three signals, plain arithmetic, no model. Each renders as a sentence with its numbers and the source ids behind it, never as a verdict. The thresholds are heuristics and are named as such in the code so you can disagree with them. On the sample data they raise 3 of 3 for `emp_002` (75% of the feedback from one manager, two months, one peer voice) and 0 of 3 for the other two — corroborating the model's `single_source_bias` flag from an independent direction.

## Governance & privacy

Stated as what the code does, not as intent.

- **The webhook is server-only.** `N8N_WEBHOOK_URL`, never `NEXT_PUBLIC_`. All three route handlers under `app/api/` proxy it; it does not appear in the client bundle.
- **The audit trail is scoped per employee, server-side.** `/api/audit-trail` requires `employee_id` and filters before responding, because the upstream webhook filters only by `report_id`. An unscoped request returns an empty set, not everything. Guarded by a test — the leak was invisible in the UI.
- **Feedback goes to the model as synthesis input only.** Nothing is used for training or retained by this app outside the n8n workflow's own store.
- **Every decision is attributable.** Actor, action, timestamp and per-field before/after are recorded and rendered back on the audit page.

Limits, stated rather than hidden:

- **No authentication.** The reviewer identity is a fixed mock value (`REVIEWER` in `lib/types.ts`). Anyone who can reach the app can approve anything. Deliberate scope decision, not an oversight.
- **No retention or deletion policy**, and no consent capture from the people whose feedback is stored.
- **The bias audit is not re-run after an edit.** An amended claim is tagged "Amended after this audit — not re-checked" rather than silently re-blessed.
- **The audit is advisory.** A reviewer can acknowledge every flag and approve.

`/governance` says the same thing in the product itself.

## Running it

```bash
npm install
cp .env.example .env.local   # leave N8N_WEBHOOK_URL empty to run on captured data
npm run dev
```

With no webhook configured the app runs on the reports in `data/mock_reports/` — real responses captured from the live backend, not hand-written fixtures — so the full journey is demonstrable offline.

## Tests

Plain `node:assert` scripts, no framework:

```bash
npx tsx lib/stats.test.ts
npx tsx lib/sources.test.ts
npx tsx lib/n8n.test.ts
npx tsc --noEmit
```
