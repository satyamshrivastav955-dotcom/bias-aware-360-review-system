import { mockInsufficientEvidence, mockReport } from "@/data/mock-report";
import { parseBody, unwrapN8n, webhookBase } from "@/lib/n8n";
import { reportSchema } from "@/lib/schemas";
import { z } from "zod";
import type { Claim, Report, SectionKey } from "@/lib/types";
import { SECTIONS } from "@/lib/types";

export const dynamic = "force-dynamic";
// Two chained LLM calls run inside n8n. Locally that settles in 35-45s, but a
// Gemini rate-limit retry pushes it past a 60s ceiling, so the route needs
// Fluid compute's longer budget. The abort below stays under it deliberately —
// our own 504 is styled and retryable; the platform's is a blank page.
export const maxDuration = 300;
const UPSTREAM_TIMEOUT_MS = 150_000;

function normalize(raw: Record<string, unknown>, employeeId: string): Report {
  const sections = {} as Record<SectionKey, Claim[]>;
  for (const { key } of SECTIONS) {
    const value = raw[key];
    sections[key] = Array.isArray(value)
      ? value.map((claim) => ({ ...(claim as Claim), flag: (claim as Claim).flag ?? null }))
      : [];
  }

  const report = reportSchema.parse({
    report_id: raw.report_id ?? crypto.randomUUID(),
    employee_id: raw.employee_id ?? employeeId,
    ...sections,
    overall_bias_summary: raw.overall_bias_summary ?? "",
    status: raw.status ?? "pending_approval",
    reviewer: raw.reviewer ?? null,
    approved_at: raw.approved_at ?? null,
    created_at: raw.created_at ?? new Date().toISOString(),
    name: raw.name,
    role: raw.role,
    audit_status: raw.audit_status ?? "complete",
    audited_claims: raw.audited_claims,
    stripped_uncited_count: raw.stripped_uncited_count ?? 0,
  });

  if (report.employee_id !== employeeId) {
    throw new Error("employee_mismatch");
  }
  return report;
}

// Extends the base schema with optional manual-input fields passed from the
// review page when the user has submitted extra feedback via /submit.
const generateRequestExtended = z.object({
  employee_id: z.string().trim().min(1),
  extra_feedback: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        reviewer: z.string().trim().min(1),
        text: z.string().trim().min(1),
        date: z.string().regex(/^\d{4}-\d{2}$/),
        kind: z.enum(["manager", "peer"]).optional(),
      }),
    )
    .optional(),
  self_assessment: z.string().optional(),
});

export async function POST(req: Request) {
  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = generateRequestExtended.safeParse(input);
  if (!parsed.success) {
    return Response.json({ error: "employee_id is required" }, { status: 400 });
  }
  const { employee_id, extra_feedback, self_assessment } = parsed.data;

  const base = webhookBase();
  const forceMock =
    new URL(req.url).searchParams.get("mock") === "1" || !base;

  if (forceMock) {
    const insufficient = mockInsufficientEvidence(employee_id);
    if (insufficient) return Response.json(insufficient);
    const report = mockReport(employee_id);
    if (!report) {
      return Response.json(
        { error: `No sample data for ${employee_id}.` },
        { status: 404 },
      );
    }
    return Response.json(report);
  }

  try {
    const res = await fetch(`${base}/generate-review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        employee_id,
        ...(extra_feedback?.length ? { extra_feedback } : {}),
        ...(self_assessment ? { self_assessment } : {}),
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    const raw = unwrapN8n(await parseBody(res));

    if (!res.ok || !raw) {
      return Response.json(
        {
          error: res.ok
            ? "The review service answered with nothing. It may be rate-limited — try again in a minute."
            : `The review service returned ${res.status}.`,
        },
        { status: 502 },
      );
    }
    // The evidence gate declined to draft. This is a successful evaluation,
    // not a failure — pass it through so the UI can say what is missing.
    if (raw.status === "insufficient_evidence") {
      return Response.json({
        insufficient: true,
        employee_id: String(raw.employee_id ?? employee_id),
        name: raw.name as string | undefined,
        role: raw.role as string | undefined,
        message: String(
          raw.message ?? "Not enough feedback on file to draft a fair review.",
        ),
        missing: Array.isArray(raw.missing) ? (raw.missing as string[]) : [],
        evidence: (raw.evidence as Record<string, number>) ?? {},
      });
    }

    try {
      return Response.json(normalize(raw, employee_id));
    } catch {
      return Response.json(
        { error: "The review service returned an invalid or mismatched report." },
        { status: 502 },
      );
    }
  } catch (e) {
    const timedOut = e instanceof Error && e.name === "TimeoutError";
    return Response.json(
      {
        error: timedOut
          ? `The review service took longer than ${UPSTREAM_TIMEOUT_MS / 1000} seconds. Try again.`
          : "Could not reach the review service.",
      },
      { status: 504 },
    );
  }
}
