#!/usr/bin/env python3
"""
Manual prompt test — runs Synthesis then Bias Detection against a mock employee,
WITHOUT n8n. This is the core acceptance test: emp_002 must produce at least one
`unsupported_claim` flag on the manager's vague growth_area point.

Usage:
  # Anthropic:
  export LLM_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-ant-...
  # or OpenAI:
  export LLM_PROVIDER=openai OPENAI_API_KEY=sk-...

  python scripts/test_prompts.py emp_002
"""
import json, os, sys, glob, urllib.request

PROVIDER = os.environ.get("LLM_PROVIDER", "bedrock")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def call_llm(prompt: str) -> str:
    if PROVIDER == "bedrock":
        import boto3
        client = boto3.client(
            "bedrock-runtime",
            region_name=os.environ.get("AWS_DEFAULT_REGION", "eu-north-1"),
        )
        resp = client.converse(
            modelId=os.environ.get("BEDROCK_MODEL_ID", "zai.glm-5"),
            messages=[{"role": "user", "content": [{"text": prompt}]}],
            inferenceConfig={"maxTokens": 4096, "temperature": 0.2},
        )
        return resp["output"]["message"]["content"][0]["text"]
    if PROVIDER == "anthropic":
        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages",
            data=json.dumps({
                "model": os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5"),
                "max_tokens": 4096,
                "messages": [{"role": "user", "content": prompt}],
            }).encode(),
            headers={
                "x-api-key": os.environ["ANTHROPIC_API_KEY"],
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
        )
        with urllib.request.urlopen(req) as r:
            return json.load(r)["content"][0]["text"]
    elif PROVIDER == "openai":
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps({
                "model": os.environ.get("OPENAI_MODEL", "gpt-4o"),
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
            }).encode(),
            headers={
                "Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}",
                "content-type": "application/json",
            },
        )
        with urllib.request.urlopen(req) as r:
            return json.load(r)["choices"][0]["message"]["content"]
    raise SystemExit(f"Unknown LLM_PROVIDER: {PROVIDER}")

def parse_json(text: str):
    t = text.strip()
    if t.startswith("```"):
        t = t.split("```")[1]
        if t.startswith("json"):
            t = t[4:]
    return json.loads(t.strip())

def load(path):
    with open(path, encoding="utf-8") as f:
        return f.read()

def main():
    emp = sys.argv[1] if len(sys.argv) > 1 else "emp_002"
    matches = glob.glob(os.path.join(ROOT, "data", "mock_employees", f"{emp}*.json"))
    if not matches:
        raise SystemExit(f"No mock file for {emp}")
    employee_data = load(matches[0])

    # --- Stage 1: Synthesis ---
    syn_prompt = load(os.path.join(ROOT, "prompts", "synthesis_agent.txt")) \
        .replace("{employee_data_json}", employee_data)
    print(f"[1/2] Synthesis Agent ({PROVIDER})...")
    synthesis = parse_json(call_llm(syn_prompt))
    for field in ["strengths", "growth_areas", "impact_highlights", "goal_progress"]:
        assert field in synthesis, f"Synthesis missing field: {field}"
    # citation validation: every source_id must exist in input
    src = json.loads(employee_data)
    valid_ids = {"self_assessment"} \
        | {f["id"] for k in ["manager_feedback", "peer_feedback", "goals", "project_outcomes"] for f in src.get(k, [])} \
        | {f"meeting_note_{i+1}" for i in range(len(src.get("meeting_notes", [])))}
    bad = [sid for sec in synthesis.values() for p in sec for sid in p.get("source_ids", []) if sid not in valid_ids]
    if bad:
        print(f"  WARNING: hallucinated source_ids: {bad}")
    print(json.dumps(synthesis, indent=2))

    # --- Stage 2: Bias Detection ---
    bias_prompt = load(os.path.join(ROOT, "prompts", "bias_detection_agent.txt")) \
        .replace("{synthesis_output_json}", json.dumps(synthesis, indent=2)) \
        .replace("{original_employee_data_json}", employee_data)
    print(f"\n[2/2] Bias Detection Agent ({PROVIDER})...")
    audited = parse_json(call_llm(bias_prompt))
    print(json.dumps(audited, indent=2))

    # --- Acceptance checks ---
    flags = [p["flag"] for sec in ["strengths", "growth_areas", "impact_highlights", "goal_progress"]
             for p in audited.get(sec, []) if p.get("flag")]
    print(f"\n=== {len(flags)} flag(s): {[f['type'] for f in flags]}")
    if emp.startswith("emp_002"):
        ok = any(f["type"] == "unsupported_claim" for f in flags)
        print("ACCEPTANCE TEST (emp_002 unsupported_claim):", "PASS" if ok else "FAIL")
        sys.exit(0 if ok else 1)
    if emp.startswith("emp_003"):
        ok = any(f["type"] == "vague_language" for f in flags)
        print("ACCEPTANCE TEST (emp_003 vague_language):", "PASS" if ok else "FAIL")
        sys.exit(0 if ok else 1)
    if emp.startswith("emp_001"):
        highs = [f for f in flags if f["severity"] == "high"]
        print("CLEAN CASE CHECK (emp_001, no high-severity flags):", "PASS" if not highs else f"FAIL {highs}")

if __name__ == "__main__":
    main()
