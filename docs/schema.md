# 🔒 LOCKED SCHEMA — v1.0 (frozen, do not change without team sync)

## 1. Mock Employee Input Schema

{
  "employee_id": "emp_001",
  "name": "string",
  "role": "string",
  "self_assessment": "string",
  "manager_feedback": [
    {"id": "manager_A_1", "reviewer": "string", "text": "string", "date": "YYYY-MM"}
  ],
  "peer_feedback": [
    {"id": "peer_B_1", "reviewer": "string", "text": "string", "date": "YYYY-MM"}
  ],
  "goals": [
    {"id": "goal_1", "goal": "string", "status": "completed" | "in_progress", "evidence": "string"}
  ],
  "project_outcomes": [
    {"id": "project_1", "project": "string", "outcome": "string"}
  ],
  "meeting_notes": ["string"]
}

RULES:
- Every feedback/goal/project item MUST have a unique "id" field
- id naming convention: {source_type}_{initial}_{number} e.g. manager_A_1, peer_B_2, goal_1, project_1
- IDs must be unique within one employee file (not globally)

---

## 2. Report Output Schema (what n8n returns to frontend)

{
  "report_id": "uuid-string",
  "employee_id": "emp_001",
  "strengths": [
    {"text": "string", "source_ids": ["peer_B_1"], "flag": null}
  ],
  "growth_areas": [
    {"text": "string", "source_ids": ["manager_A_1"],
     "flag": {"type": "unsupported_claim", "reasoning": "string", "severity": "high"} }
  ],
  "impact_highlights": [
    {"text": "string", "source_ids": ["project_1"], "flag": null}
  ],
  "goal_progress": [
    {"text": "string", "source_ids": ["goal_1"], "flag": null}
  ],
  "overall_bias_summary": "string",
  "status": "pending_approval" | "approved" | "rejected",
  "reviewer": null,
  "approved_at": null,
  "created_at": "ISO-timestamp"
}

RULES:
- "flag" is either null OR an object with exactly: type, reasoning, severity
- flag.type is ONE OF: "unsupported_claim" | "recency_bias" | "single_source_bias" | "vague_language"
- flag.severity is ONE OF: "low" | "medium" | "high"
- source_ids must reference real ids from the input employee file — never invented

---

## 3. API Contract (n8n Webhooks)

### POST /webhook/generate-review
Request:  { "employee_id": "emp_001" }
Response: <Report Output Schema above, full object>

### POST /webhook/approve-review
Request:  {
  "report_id": "uuid-string",
  "action": "approve" | "reject" | "edit",
  "reviewer": "string",
  "edited_fields": { ... optional, only if action=edit, same shape as report fields }
}
Response: {
  "report_id": "uuid-string",
  "status": "approved" | "rejected" | "pending_approval",
  "reviewer": "string",
  "approved_at": "ISO-timestamp" | null
}

---

## 4. Database Table: reports

id            UUID PRIMARY KEY
employee_id   TEXT NOT NULL
draft_json    JSONB NOT NULL        -- full Report Output Schema
status        TEXT DEFAULT 'pending_approval'
reviewer      TEXT
approved_at   TIMESTAMP
edit_history  JSONB DEFAULT '[]'    -- array of {timestamp, reviewer, changes}
created_at    TIMESTAMP DEFAULT now()

---

## 🔒 THIS IS FROZEN — v1.0
Any change requires posting in team chat + explicit ack from Frontend before backend changes it.
Frontend: build your entire UI against this shape using the sample files below — 
you do NOT need to wait for the real backend.