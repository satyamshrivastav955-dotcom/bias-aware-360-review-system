# n8n Workflows — Import & Setup

## Import
1. n8n Cloud → Workflows → Add workflow → ⋯ → **Import from File**
2. Import `generate-review.json` (Workflow A) and `approve-review.json` (Workflow B)

## After import — required edits (5 min)
### Workflow A
1. **Resolve Data URL** Code node: replace `<GITHUB_USER>/<REPO>` with your actual repo (mock data files must be pushed to GitHub `main` first).
2. **Both LLM nodes** (Synthesis + Bias Detection): pre-wired for **AWS Bedrock GLM-5** (`zai.glm-5`, region `eu-north-1`).
   - Create Credential → **AWS**: Access Key ID + Secret + region `eu-north-1`. Attach to both nodes.
   - If your region differs, edit the URL host (`bedrock-runtime.<region>.amazonaws.com`).
3. **Insert Report (Postgres)** node: attach your Postgres credential (Supabase → Project Settings → Database → connection string; use the *Session pooler* host, port 5432, SSL on).
4. Run `scripts/init_db.sql` against the DB first (Supabase SQL editor works).

### Workflow B
1. Attach the same Postgres credential to **Update Report (Postgres)**.

## Activate
Toggle both workflows **Active**. Production URLs become:
- `https://<yourname>.app.n8n.cloud/webhook/generate-review`
- `https://<yourname>.app.n8n.cloud/webhook/approve-review`

CORS is already set to `*` in both Webhook nodes.

## Test
```bash
N8N_URL=https://<yourname>.app.n8n.cloud bash scripts/test_pipeline.sh
```

## API contracts (hand to frontend)
### POST /webhook/generate-review
Request: `{"employee_id": "emp_001" | "emp_002" | "emp_003"}`
Response: full report JSON — `report_id`, `employee_id`, `employee_name`, `strengths[]`, `growth_areas[]`, `impact_highlights[]`, `goal_progress[]` (each point: `{text, source_ids[], flag}` where flag is `null` or `{type, reasoning, severity}`), `overall_bias_summary`, `flag_counts`, `status`.

### POST /webhook/approve-review
Request: `{"report_id": "<uuid>", "action": "approve"|"reject"|"edit", "reviewer": "string", "edited_fields": {...}?}`
Response: `{report_id, employee_id, status, reviewer, approved_at, edit_history[]}`
- `edit` merges `edited_fields` into draft_json and appends to edit_history (stays pending_approval)
- `approve`/`reject` set final status; approve stamps `approved_at`
