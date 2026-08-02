import { parseBody, scopeToEmployee, unwrapN8n, webhookBase } from "@/lib/n8n";
import { eraseRequestSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// Erasure of everything this system generated about one person: the drafts, the
// final reports, and the source row the model was given. The audit trail is
// deliberately not erased — it is emptied of content but keeps the record that
// an erasure happened, who asked, and on what ground. A deletion that also
// deletes the evidence of itself is not a governance control.
//
// Unlike the read endpoints this one fails loudly. A reviewer who is told data
// is gone must not have to wonder, so an unreachable backend is an error here,
// never a shrug.
export async function DELETE(req: Request) {
  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = eraseRequestSchema.safeParse(input);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid erasure request.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const base = webhookBase();
  if (!base) {
    return Response.json(
      {
        error: "no_backend",
        detail:
          "No review service is configured, so there is nothing on a server to erase. The browser copy is cleared regardless.",
      },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(`${base}/erase-employee-data`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(15_000),
    });
    const raw = unwrapN8n(await parseBody(res));
    if (!res.ok || raw?.ok !== true) {
      return Response.json(
        { error: "erase_rejected", detail: raw?.error ?? null },
        { status: 502 },
      );
    }

    // The same scoping the audit trail gets: confirm every row the backend
    // reports deleting belongs to the employee we asked about. A workflow bug
    // that widened the delete would otherwise be reported back as a success.
    const erased = Array.isArray(raw.erased)
      ? (raw.erased as { employee_id: string }[])
      : [];
    if (scopeToEmployee(erased, parsed.data.employee_id).length !== erased.length) {
      return Response.json({ error: "erase_out_of_scope" }, { status: 502 });
    }

    return Response.json({
      erased: erased.length,
      reports_erased: raw.reports_erased ?? erased.length,
      audit_rows_redacted: raw.audit_rows_redacted ?? 0,
    });
  } catch {
    return Response.json({ error: "erase_unreachable" }, { status: 504 });
  }
}
