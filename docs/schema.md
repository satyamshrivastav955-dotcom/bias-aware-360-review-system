# Application Contract — v1.1

This document describes the current frontend, Next.js API, and exported n8n workflow contract. Changes require synchronized updates to runtime schemas, prompts, workflow exports, fixtures, tests, and this document.

## Employee input

```json
{
  "employee_id": "emp_001",
  "name": "string",
  "role": "string",
  "self_assessment": "string",
  "manager_feedback": [
    { "id": "manager_A_1", "reviewer": "string", "text": "string", "date": "YYYY-MM" }
  ],
  "peer_feedback": [
    { "id": "peer_B_1", "reviewer": "string", "text": "string", "date": "YYYY-MM" }
  ],
  "goals": [
    { "id": "goal_1", "goal": "string", "status": "completed", "evidence": "string" }
  ],
  "project_outcomes": [
    { "id": "project_1", "project": "string", "outcome": "string" }
  ],
  "meeting_notes": ["string"]
}
```

All feedback, goal, and project IDs must be unique within an employee record.

## Canonical source IDs

- Self-assessment: `self_1`.
- Manager/peer feedback, goals, and projects: their input `id` value.
- Meeting notes: `note_1`, `note_2`, and so on (1-indexed).

## Report output

```json
{
  "report_id": "uuid-string",
  "employee_id": "emp_001",
  "strengths": [
    { "text": "string", "source_ids": ["peer_B_1"], "flag": null }
  ],
  "growth_areas": [
    {
      "text": "string",
      "source_ids": ["manager_A_1"],
      "flag": {
        "type": "unsupported_claim",
        "reasoning": "string",
        "severity": "high"
      }
    }
  ],
  "impact_highlights": [],
  "goal_progress": [],
  "overall_bias_summary": "string",
  "status": "pending_approval",
  "reviewer": null,
  "approved_at": null,
  "created_at": "ISO-timestamp",
  "audit_status": "complete",
  "audited_claims": 2,
  "stripped_uncited_count": 0
}
```

Supported flag types are `unsupported_claim`, `recency_bias`, `single_source_bias`, `vague_language`, and `contradiction`. Severity is `low`, `medium`, or `high`. Every claim must have at least one real source ID. Every claim must receive exactly one bias-audit result; an omitted, duplicate, malformed, or unknown `point_ref` fails generation rather than being interpreted as a clean claim.

## Webhooks

### `POST /webhook/generate-review`

Request:

```json
{ "employee_id": "emp_001" }
```

Response: the complete report output above.

### `POST /webhook/approve-review`

Request:

```json
{
  "report_id": "uuid-string",
  "action": "approved",
  "reviewer": "Manager",
  "edits": {
    "growth_areas": [
      { "text": "amended claim", "source_ids": ["manager_A_1"], "flag": null }
    ]
  },
  "acknowledged_refs": ["growth_areas[0]"]
}
```

`action` is `approved` or `rejected`. Editing alone does not clear a high-severity flag; each such flag must be explicitly reviewed and included in `acknowledged_refs` before approval. Rejection remains available without acknowledgement.

Response:

```json
{
  "report_id": "uuid-string",
  "status": "approved",
  "reviewer": "Manager",
  "approved_at": "ISO-timestamp"
}
```

Approval may return `422 unresolved_high_severity_flags`, `404 report_not_found`, or `409 already_finalized`.

### `GET /webhook/audit-trail`

Returns `{ "entries": [...] }`. The Next.js proxy requires an `employee_id` and filters entries by employee before returning them to the browser.

## Persistence

The implemented database shape is defined in `db/schema.sql`. Reports retain `draft_json` and optional `final_json`; decisions and field-level changes are appended to `audit_log`. The current prototype does not yet enforce authentication, row-level security, retention/deletion policy, or database-level append-only permissions; see the governance page and README limitations.
