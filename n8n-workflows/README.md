# n8n Workflows

## Live deployment

| | |
|---|---|
| Instance | `https://suju1509.app.n8n.cloud` |
| Workflow A | `A - generate-review` (id `LGGoOdiDTVdKrMon`) — **active** |
| Workflow B | `B - approve-review` (id `mzrCmPUrDAmEidjO`) — **active** |
| Webhook A | `POST /webhook/generate-review` — body `{"employee_id": "emp_001"}` |
| Webhook B | `POST /webhook/approve-review` — body below |
| Webhook B2 | `GET /webhook/audit-trail[?report_id=<uuid>]` |
| Latency | A: ~25–40 s (two sequential LLM calls) · B: <2 s |

## Architecture (9 nodes)

```
Webhook (CORS *, responseNode)
  → Postgres: fetch employee raw_data
  → Code: flatten sources + build synthesis prompt (whitelists valid source_ids)
  → HTTP: Synthesis Agent    — Gemini 2.5 Flash, responseSchema-constrained, temp 0.2
  → Code: validate, strip hallucinated source_ids, drop uncited points
  → Code: build bias prompt (adds date distribution + point_ref indexing)
  → HTTP: Bias Detection Agent — Gemini 2.5 Flash, temp 0.1, 5 checks
  → Code: merge flags onto points by point_ref
  → Postgres: insert report + audit_log row (single CTE)
  → Respond with full report JSON + report_id
```

## Workflow B — approve-review (10 nodes, verified)

`POST /webhook/approve-review`:

```json
{
  "report_id": "<uuid from generate-review>",
  "action": "approved",            // or "rejected"
  "reviewer": "Manager Name",      // required — goes into the audit trail
  "edits": {                       // optional — full replacement arrays per section
    "growth_areas": [{"text": "rewritten point", "source_ids": ["..."]}]
  },
  "acknowledged_refs": ["growth_areas[1]"]   // optional — accept a flag as-is
}
```

**The guard (the human-in-the-loop enforcement):** approval is refused with
`422 unresolved_high_severity_flags` while any high-severity flag is neither
edited nor listed in `acknowledged_refs`. The 422 body lists every unresolved
flag with its reasoning, so the frontend can render exactly what must be
addressed. Rejection is always allowed.

Other verified responses:
- `200` — finalized; report status/final_json/reviewer/approved_at updated,
  audit row written with the field-level edit diff + acknowledged refs
- `404 report_not_found` — unknown report_id
- `409 already_finalized` — report was already approved/rejected (idempotency)
- `400 invalid_action` / `400 reviewer_required`

`GET /webhook/audit-trail` returns the last 100 audit entries (joined with
employee_id + report status); `?report_id=<uuid>` filters to one report.
This feeds the demo's audit-trail screen.

## Credentials (already created on the instance)

| Name | Type | Used by |
|---|---|---|
| `Supabase Postgres` | postgres | both Postgres nodes |
| `Gemini Key Synthesis` | httpHeaderAuth | Synthesis Agent |
| `Gemini Key Bias` | httpHeaderAuth | Bias Detection Agent |

**Why two Gemini keys:** the free tier caps at 20 requests/min *per key per model*.
One key shared across both agents made the second call fail with 429 under
back-to-back runs. Separate keys give each agent an independent quota pool.
Both HTTP nodes also have `retryOnFail` (5 tries, 15 s backoff) as a safety net.

Header auth config: header name `x-goog-api-key`, value = the API key.

## Database

Supabase project `hmscfvtkmohmtsnzzval`.

**Connect via the pooler, not the direct host.** `db.<ref>.supabase.co` resolves
to IPv6 only and n8n Cloud is IPv4-only — it fails with `ENETUNREACH`.

```
host: aws-0-ap-southeast-1.pooler.supabase.com
port: 5432
user: postgres.hmscfvtkmohmtsnzzval
db:   postgres
ssl:  require
```

Setup: run `db/schema.sql` then `db/seed.sql`.

## Test

```bash
curl -X POST https://suju1509.app.n8n.cloud/webhook/generate-review \
  -H "Content-Type: application/json" \
  -d '{"employee_id": "emp_002"}'
```

**Verified behaviour** (3 consecutive runs, stable):
- `emp_001` (clean case) → **0 flags**
- `emp_002` (biased case) → **3 flags**, including `high/contradiction` on
  "consistently misses deadlines" (contradicted by two on-time ships +
  documented double workload) and `high/single_source_bias` on
  "lacks ownership" (no supporting example anywhere in sources)

## Prompt-tuning notes

Two calibration problems were found and fixed during testing — worth knowing
before you touch the prompts:

1. **Auditor over-flagging.** Initially flagged well-evidenced points. Fixed by
   telling it to default to `flag: null`, and to not flag single-source points
   that contain a concrete verifiable example.

2. **Synthesis was laundering the evidence.** The bigger issue. The synthesis
   agent rewrote "consistently misses deadlines" into "an opportunity to improve
   deadline adherence" — which destroyed the auditor's ability to detect the
   bias, because the harsh claim no longer existed in the text being audited.
   Flag counts swung 1–4 between runs as a result. Fixed with an explicit
   faithfulness rule in the synthesis prompt: represent each source's claim as
   made, do not soften or add mitigating context. **Don't reintroduce
   "growth_areas must be constructive" — that instruction caused this bug.**

Iterate cheaply: pin the output of `Fetch employee`, then edit downstream nodes
without re-hitting the DB. Use the test URL (`/webhook-test/generate-review`)
during development.

## Redeploy after editing the JSON

```bash
n8n-cli workflow update LGGoOdiDTVdKrMon --file=n8n-workflows/generate-review.json
```
