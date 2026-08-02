#!/usr/bin/env bash
# End-to-end webhook tests against the live n8n workflows.
# Usage: N8N_URL=https://yourname.app.n8n.cloud ./scripts/test_pipeline.sh
set -euo pipefail
: "${N8N_URL:?Set N8N_URL to your n8n cloud base URL}"

echo "== Test 1: clean case (emp_001) =="
curl -sS -X POST "$N8N_URL/webhook/generate-review" \
  -H "Content-Type: application/json" \
  -d '{"employee_id": "emp_001"}' | tee /tmp/emp_001_report.json | python -m json.tool >/dev/null && echo " OK (valid JSON)"

echo
echo "== Test 2: biased case (emp_002) — must contain unsupported_claim flag =="
curl -sS -X POST "$N8N_URL/webhook/generate-review" \
  -H "Content-Type: application/json" \
  -d '{"employee_id": "emp_002"}' | tee /tmp/emp_002_report.json | python -m json.tool >/dev/null

python - <<'EOF'
import json
r = json.load(open("/tmp/emp_002_report.json"))
flags = [p["flag"] for sec in ["strengths","growth_areas","impact_highlights","goal_progress"]
         for p in r.get(sec, []) if p.get("flag")]
types = [f["type"] for f in flags]
print("flags:", types)
assert "unsupported_claim" in types, "ACCEPTANCE FAIL: no unsupported_claim flag on emp_002"
print("ACCEPTANCE PASS: unsupported_claim flagged")
print("report_id:", r.get("report_id"))
EOF

REPORT_ID=$(python -c "import json;print(json.load(open('/tmp/emp_002_report.json')).get('report_id',''))")

echo
echo "== Test 3: unacknowledged approval must be blocked =="
curl -sS -X POST "$N8N_URL/webhook/approve-review" \
  -H "Content-Type: application/json" \
  -d "{\"report_id\": \"$REPORT_ID\", \"action\": \"approved\", \"reviewer\": \"Manager A\"}" \
  | tee /tmp/emp_002_blocked.json | python -m json.tool

python - <<'EOF'
import json
r = json.load(open("/tmp/emp_002_blocked.json"))
assert r.get("error") == "unresolved_high_severity_flags", "ACCEPTANCE FAIL: approval was not blocked"
assert r.get("unresolved_count", 0) > 0, "ACCEPTANCE FAIL: no unresolved flags returned"
print("ACCEPTANCE PASS: high-severity approval blocked")
EOF

ACKS=$(python - <<'EOF'
import json
r = json.load(open("/tmp/emp_002_blocked.json"))
print(json.dumps([p["point_ref"] for p in r["unresolved"]]))
EOF
)

echo
echo "== Test 4: explicitly acknowledged approval succeeds =="
curl -sS -X POST "$N8N_URL/webhook/approve-review" \
  -H "Content-Type: application/json" \
  -d "{\"report_id\": \"$REPORT_ID\", \"action\": \"approved\", \"reviewer\": \"Manager A\", \"acknowledged_refs\": $ACKS}" \
  | tee /tmp/emp_002_approved.json | python -m json.tool

python - <<'EOF'
import json
r = json.load(open("/tmp/emp_002_approved.json"))
assert r.get("status") == "approved", "ACCEPTANCE FAIL: acknowledged approval did not finalize"
print("ACCEPTANCE PASS: acknowledged approval finalized")
EOF

echo
echo "All tests done."
