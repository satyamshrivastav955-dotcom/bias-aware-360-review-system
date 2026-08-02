import { parseBody, unwrapN8n, webhookBase } from "@/lib/n8n";
import { acknowledgeRequestSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// Acknowledging a flag is a decision, so it is written to the server trail when
// it happens rather than being carried along until approval. A reviewer who
// acknowledges and then walks away has still decided something, and the
// governance page promises that is on the record.
//
// Deliberately never fails the caller's flow: the acknowledgement is already
// true in the browser by the time this runs, and refusing it because a webhook
// is unreachable would make the UI lie about what the reviewer did. The
// response says whether it reached the server so the UI can say so too.
export async function POST(req: Request) {
  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = acknowledgeRequestSchema.safeParse(input);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid acknowledgement.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const base = webhookBase();
  if (!base) return Response.json({ recorded: false, reason: "no_backend" });

  try {
    const res = await fetch(`${base}/acknowledge`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(10_000),
    });
    const raw = unwrapN8n(await parseBody(res));
    if (!res.ok || raw?.ok !== true) {
      return Response.json({ recorded: false, reason: "rejected" });
    }
    return Response.json({ recorded: true });
  } catch {
    return Response.json({ recorded: false, reason: "unreachable" });
  }
}
