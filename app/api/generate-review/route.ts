import { mockReport } from "@/data/mock-report";
import { parseBody, unwrapN8n, webhookBase } from "@/lib/n8n";
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
    const v = raw[key];
    sections[key] = Array.isArray(v)
      ? (v as Claim[]).map((c) => ({ ...c, flag: c.flag ?? null }))
      : [];
  }
  return {
    report_id: String(raw.report_id ?? crypto.randomUUID()),
    employee_id: String(raw.employee_id ?? employeeId),
    ...sections,
    overall_bias_summary: String(raw.overall_bias_summary ?? ""),
    status: (raw.status as Report["status"]) ?? "pending_approval",
    reviewer: (raw.reviewer as string | null) ?? null,
    approved_at: (raw.approved_at as string | null) ?? null,
    // Live n8n returns no created_at, so the arrival time is the honest stamp.
    created_at: String(raw.created_at ?? new Date().toISOString()),
    name: raw.name as string | undefined,
    role: raw.role as string | undefined,
  };
}

export async function POST(req: Request) {
  const { employee_id } = (await req.json()) as { employee_id?: string };
  if (!employee_id) {
    return Response.json({ error: "employee_id is required" }, { status: 400 });
  }

  const base = webhookBase();
  const forceMock =
    new URL(req.url).searchParams.get("mock") === "1" || !base;

  if (forceMock) {
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
      body: JSON.stringify({ employee_id }),
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
    if (!Array.isArray(raw.strengths)) {
      return Response.json(
        { error: "The review service returned an unexpected report shape." },
        { status: 502 },
      );
    }

    return Response.json(normalize(raw, employee_id));
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
