import { parseBody, unwrapN8n, webhookBase } from "@/lib/n8n";
import type { ApproveResponse, EditedFields, ReportStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  report_id?: string;
  action?: "approved" | "rejected";
  reviewer?: string;
  edits?: EditedFields;
  acknowledged_refs?: string[];
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const { report_id, action, reviewer } = body;

  if (!report_id || !action || !reviewer) {
    return Response.json(
      { error: "report_id, action, and reviewer are required" },
      { status: 400 },
    );
  }
  if (action !== "approved" && action !== "rejected") {
    return Response.json({ error: "invalid_action" }, { status: 400 });
  }

  const base = webhookBase();
  const forceMock = new URL(req.url).searchParams.get("mock") === "1" || !base;

  if (forceMock) {
    const res: ApproveResponse = {
      report_id,
      status: action as ReportStatus,
      reviewer,
      approved_at: action === "approved" ? new Date().toISOString() : null,
    };
    return Response.json(res);
  }

  try {
    const res = await fetch(`${base}/approve-review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    const raw = unwrapN8n(await parseBody(res));

    // n8n's Respond node reports the real status in the body as well as in the
    // HTTP status. Trust whichever one indicates a failure.
    const status = Number(raw?.__http_status ?? res.status);

    // The human-in-the-loop guard. Pass it through verbatim — the UI needs
    // every unresolved flag to tell the reviewer exactly what to address.
    if (status === 422) return Response.json(raw, { status: 422 });

    if (status === 404) {
      return Response.json(
        {
          error:
            "This report is no longer on the server. Draft it again before approving.",
        },
        { status: 404 },
      );
    }
    if (status === 409) {
      return Response.json(
        { error: "This report was already finalized. Reload to see it." },
        { status: 409 },
      );
    }
    if (status >= 400 || !raw) {
      return Response.json(
        { error: `The review service returned ${status}.` },
        { status: 502 },
      );
    }

    const merged: ApproveResponse = {
      report_id: String(raw.report_id ?? report_id),
      status: (raw.status as ReportStatus) ?? (action as ReportStatus),
      reviewer: String(raw.reviewer ?? reviewer),
      approved_at: (raw.approved_at as string | null) ?? null,
    };
    return Response.json(merged);
  } catch {
    return Response.json(
      { error: "Could not reach the review service. Nothing was recorded." },
      { status: 504 },
    );
  }
}
