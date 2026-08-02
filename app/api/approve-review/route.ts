import { parseBody, unwrapN8n, webhookBase } from "@/lib/n8n";
import { approveRequestSchema, approveResponseSchema } from "@/lib/schemas";
import type { ApproveResponse, EditedFields } from "@/lib/types";

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
  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = approveRequestSchema.safeParse(input);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid approval request.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const body: Body = parsed.data;
  const { report_id, action, reviewer } = parsed.data;

  const base = webhookBase();
  const forceMock = new URL(req.url).searchParams.get("mock") === "1" || !base;

  if (forceMock) {
    const res: ApproveResponse = {
      report_id,
      status: action,
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

    const merged = approveResponseSchema.safeParse({
      report_id: raw.report_id ?? report_id,
      status: raw.status ?? action,
      reviewer: raw.reviewer ?? reviewer,
      approved_at: raw.approved_at ?? null,
    });
    if (!merged.success || merged.data.report_id !== report_id) {
      return Response.json(
        { error: "The review service returned an invalid approval response." },
        { status: 502 },
      );
    }
    return Response.json(merged.data satisfies ApproveResponse);
  } catch {
    return Response.json(
      { error: "Could not reach the review service. Nothing was recorded." },
      { status: 504 },
    );
  }
}
