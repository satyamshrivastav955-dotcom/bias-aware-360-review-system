import { parseBody, unwrapN8n, webhookBase } from "@/lib/n8n";
import type { ApproveResponse, EditedFields, ReportStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  report_id?: string;
  action?: "approve" | "reject" | "edit";
  reviewer?: string;
  edited_fields?: EditedFields;
};

// The status enum has no "edited" member — an edit leaves the report pending.
const statusFor = (action: string): ReportStatus =>
  action === "approve"
    ? "approved"
    : action === "reject"
      ? "rejected"
      : "pending_approval";

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const { report_id, action, reviewer } = body;

  if (!report_id || !action || !reviewer) {
    return Response.json(
      { error: "report_id, action, and reviewer are required" },
      { status: 400 },
    );
  }

  const base = webhookBase();
  const forceMock = new URL(req.url).searchParams.get("mock") === "1" || !base;

  if (forceMock) {
    const res: ApproveResponse = {
      report_id,
      status: statusFor(action),
      reviewer,
      approved_at: action === "approve" ? new Date().toISOString() : null,
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

    if (!res.ok) {
      return Response.json(
        { error: `The review service returned ${res.status}.` },
        { status: 502 },
      );
    }

    const merged: ApproveResponse = {
      report_id: String(raw?.report_id ?? report_id),
      status: (raw?.status as ReportStatus) ?? statusFor(action),
      reviewer: String(raw?.reviewer ?? reviewer),
      approved_at: (raw?.approved_at as string | null) ?? null,
    };
    return Response.json(merged);
  } catch {
    return Response.json(
      { error: "Could not reach the review service. Nothing was recorded." },
      { status: 504 },
    );
  }
}
