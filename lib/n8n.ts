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

// The upstream webhook only filters by report_id, so scoping to one employee
// has to happen on our side. Audit entries quote verbatim performance feedback
// about a named person — returning the whole table and filtering in the browser
// would hand every reviewer everyone else's file. Lives here, not in the route:
// Next.js rejects a route module that exports anything but handlers.
export function scopeToEmployee<T extends { employee_id: string }>(
  entries: T[],
  employeeId: string | null,
): T[] {
  if (!employeeId) return [];
  return entries.filter((e) => e.employee_id === employeeId);
}
