import { parseBody, scopeToEmployee, unwrapN8n, webhookBase } from "@/lib/n8n";
import type { ServerAuditEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

// Read-only proxy so the webhook URL stays server-side. The audit page falls
// back to its local copy when this returns anything other than 200.
export async function GET(req: Request) {
  const base = webhookBase();
  const params = new URL(req.url).searchParams;
  const employeeId = params.get("employee_id");
  if (!base) return Response.json({ entries: [] });

  const reportId = params.get("report_id");
  const url = `${base}/audit-trail${reportId ? `?report_id=${encodeURIComponent(reportId)}` : ""}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    const raw = unwrapN8n(await parseBody(res));
    if (!res.ok || !Array.isArray(raw?.entries)) {
      return Response.json({ error: "audit_unavailable" }, { status: 502 });
    }
    return Response.json({
      entries: scopeToEmployee(raw.entries as ServerAuditEntry[], employeeId),
    });
  } catch {
    return Response.json({ error: "audit_unreachable" }, { status: 504 });
  }
}
