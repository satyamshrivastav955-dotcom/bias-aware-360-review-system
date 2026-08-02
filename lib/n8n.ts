// n8n's Respond to Webhook node returns `{...}`, `[{...}]`, or `[{json:{...}}]`
// depending on how the workflow ends. Accept all three.
export function unwrapN8n(json: unknown): Record<string, unknown> | null {
  const first = Array.isArray(json) ? json[0] : json;
  if (!first || typeof first !== "object") return null;
  const obj = first as Record<string, unknown>;
  const inner = obj.json;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return obj;
}

// n8n returns HTML on 5xx, which makes res.json() throw. It also answers 200
// with a zero-byte body when a node fails downstream of the webhook — seen live
// when Gemini rate-limits. Returning null there lets callers report "the
// service returned nothing" instead of misfiling it as an unreachable host.
export async function parseBody(res: Response): Promise<unknown> {
  const type = res.headers.get("content-type") ?? "";
  const text = await res.text();
  if (!text.trim()) return null;
  if (!type.includes("json")) {
    throw new Error(
      `n8n returned ${res.status} ${type || "unknown type"}: ${text.slice(0, 200)}`,
    );
  }
  return JSON.parse(text);
}

export const webhookBase = () =>
  process.env.N8N_WEBHOOK_URL?.replace(/\/$/, "") || null;
