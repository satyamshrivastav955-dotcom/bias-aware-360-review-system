import { parseVerdict } from "@/lib/reaudit";
import { reauditRequestSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// The third agent. Gemini writes the draft and audits it; this one is asked a
// narrower question by a different provider — is this one amended sentence
// still biased? Two agents from one vendor sharing one prompt lineage tend to
// share blind spots, so the second opinion comes from somewhere else.
//
// It is additive. `lib/reaudit.ts` already re-checks every amendment
// deterministically and keeps working when this is unconfigured or down. This
// adds judgment the word lists cannot reach — sarcasm, faint praise, wording
// that is clean term by term and dismissive as a sentence.
//
// Only the sentence is sent. No name, no employee id, no source feedback:
// answering "is this biased" does not require knowing whose review it is.

const ENDPOINT = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";

export async function POST(req: Request) {
  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = reauditRequestSchema.safeParse(input);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid re-audit request.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const apiKey = process.env.LYZR_API_KEY;
  const agentId = process.env.LYZR_AGENT_ID;
  // Unconfigured is a normal state, not an error: the deterministic re-check is
  // the control, and this is a second opinion on top of it. The UI shows
  // nothing rather than an apology for a service the reviewer never asked for.
  if (!apiKey || !agentId) {
    return Response.json({ available: false, reason: "not_configured" });
  }

  const prompt = [
    "You are reviewing one sentence from a performance review for bias.",
    parsed.data.original_flag_type
      ? `An earlier audit flagged this claim as ${parsed.data.original_flag_type}; the reviewer has since rewritten it. Judge the rewrite on its own terms.`
      : "",
    "",
    `Sentence: "${parsed.data.text}"`,
    "",
    "Look for what a word list cannot catch: sarcasm, faint praise, damning",
    "understatement, wording that is clean term by term but dismissive as a",
    "whole, and judgments about the person rather than their work.",
    "Default to biased: false. A plainly-worded claim backed by a concrete",
    "example is not biased merely for being critical.",
    'Reply with only JSON: {"biased": boolean, "severity": "low"|"medium"|"high", "reasoning": "one sentence"}',
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        user_id: "bias-aware-review",
        agent_id: agentId,
        // Per claim, not per session: each sentence is judged on its own, and a
        // shared session would let one verdict colour the next.
        session_id: `reaudit-${agentId}`,
        message: prompt,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      return Response.json({ available: false, reason: "upstream_error" });
    }
    const data = (await res.json()) as { response?: string };
    const verdict =
      typeof data.response === "string" ? parseVerdict(data.response) : null;
    if (!verdict) {
      return Response.json({ available: false, reason: "unparseable" });
    }
    return Response.json({ available: true, verdict });
  } catch {
    return Response.json({ available: false, reason: "unreachable" });
  }
}
