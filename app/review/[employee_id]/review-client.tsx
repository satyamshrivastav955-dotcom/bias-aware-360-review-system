"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ClaimRow from "@/components/claim-row";
import SourceDrawer from "@/components/source-drawer";
import { buildSourceMap, resolveSource } from "@/lib/sources";
import {
  appendAudit,
  clearEmployee,
  loadOriginal,
  loadReport,
  saveOriginal,
  saveReport,
} from "@/lib/store";
import {
  REVIEWER,
  SECTIONS,
  type ApproveResponse,
  type Claim,
  type EditedFields,
  type Employee,
  type Report,
  type SectionKey,
  type Severity,
  type Source,
} from "@/lib/types";

const STAGES = ["Reading feedback files", "Executing bias audit", "Finalizing review draft"];

export default function ReviewClient({ employee }: { employee: Employee }) {
  const [hydrated, setHydrated] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [original, setOriginal] = useState<Report | null>(null);
  const [stage, setStage] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<Source | null>(null);

  const id = employee.employee_id;
  const sourceMap = useMemo(() => buildSourceMap(employee), [employee]);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("reset") === "1") {
      clearEmployee(id);
    }
    setReport(loadReport(id));
    setOriginal(loadOriginal(id));
    setHydrated(true);
  }, [id]);

  const dirty =
    !!report &&
    !!original &&
    SECTIONS.some(
      ({ key }) => JSON.stringify(report[key]) !== JSON.stringify(original[key]),
    );
  const locked = !!report && report.status !== "pending_approval";
  const canEdit = !!report && !locked && !busy;

  const counts = useMemo(() => {
    const c: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
    if (report) {
      for (const { key } of SECTIONS)
        for (const claim of report[key]) if (claim.flag) c[claim.flag.severity]++;
    }
    return c;
  }, [report]);

  async function generate() {
    if (locked && !confirm("This review is already finalized. Replace it with a new draft?"))
      return;

    setBusy(true);
    setError(null);
    setStage(0);
    const advance = setTimeout(() => setStage(1), 1500);
    const started = Date.now();

    try {
      const res = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ employee_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not draft the review.");

      clearTimeout(advance);
      await new Promise((r) => setTimeout(r, Math.max(0, 1800 - (Date.now() - started))));
      setStage(2);
      await new Promise((r) => setTimeout(r, 600));

      const next = data as Report;
      setReport(next);
      setOriginal(next);
      saveReport(id, next);
      saveOriginal(id, next);

      const flags = SECTIONS.reduce(
        (n, s) => n + next[s.key].filter((c) => c.flag).length,
        0,
      );
      appendAudit(id, {
        ts: new Date().toISOString(),
        reviewer: REVIEWER,
        action: "generated",
        report_id: next.report_id,
        summary: `Draft created · ${flags} claim${flags === 1 ? "" : "s"} flagged`,
      });
    } catch (e) {
      clearTimeout(advance);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setStage(null);
      setBusy(false);
    }
  }

  function editClaim(key: SectionKey, index: number, text: string) {
    setReport((prev) =>
      prev
        ? {
            ...prev,
            [key]: prev[key].map((c, i) => (i === index ? { ...c, text } : c)),
          }
        : prev,
    );
  }

  function changedSections(): EditedFields {
    if (!report || !original) return {};
    const out: EditedFields = {};
    for (const { key } of SECTIONS) {
      if (JSON.stringify(report[key]) !== JSON.stringify(original[key])) {
        out[key] = report[key];
      }
    }
    return out;
  }

  function diffSummary(fields: EditedFields) {
    if (!report || !original) return "";
    return (
      Object.keys(fields)
        .map((k) => {
          const key = k as SectionKey;
          const n = report[key].filter(
            (c, i) => c.text !== original[key][i]?.text,
          ).length;
          const label = SECTIONS.find((s) => s.key === key)!.title.toLowerCase();
          return `${n} claim${n === 1 ? "" : "s"} in ${label}`;
        })
        .join(", ") || "no textual change"
    );
  }

  async function submit(action: "edit" | "approve" | "reject") {
    if (!report) return;
    setBusy(true);
    setError(null);

    const fields = changedSections();
    const carriesEdits = Object.keys(fields).length > 0;

    try {
      const res = await fetch("/api/approve-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          report_id: report.report_id,
          action,
          reviewer: REVIEWER,
          ...(carriesEdits ? { edited_fields: fields } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "The service rejected the request.");

      const confirmed = data as ApproveResponse;
      const next: Report = {
        ...report,
        status: confirmed.status,
        reviewer: confirmed.reviewer,
        approved_at: confirmed.approved_at,
      };
      setReport(next);
      setOriginal(next);
      saveReport(id, next);
      saveOriginal(id, next);

      appendAudit(id, {
        ts: new Date().toISOString(),
        reviewer: REVIEWER,
        action,
        report_id: report.report_id,
        summary:
          action === "edit"
            ? `Edited ${diffSummary(fields)}`
            : carriesEdits
              ? `${action === "approve" ? "Approved" : "Rejected"} with edits to ${diffSummary(fields)}`
              : action === "approve"
                ? "Approved as drafted"
                : "Rejected as drafted",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const claimSources = (claim: Claim) =>
    claim.source_ids.map((sid) => resolveSource(sourceMap, sid));

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 pb-32">
      {/* Top Nav */}
      <nav className="no-print mb-6 flex items-center justify-between border-b border-slate-200 pb-4 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-slate-900 transition-colors">
          &larr; Back to Employee Selector
        </Link>
        <Link href={`/audit/${id}`} className="hover:text-slate-900 transition-colors">
          View Compliance Audit Trail &rarr;
        </Link>
      </nav>

      {/* Header Banner */}
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">
                {id}
              </span>
              {report && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ${
                  report.status === "approved"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : report.status === "rejected"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  {report.status.replace("_", " ")}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">{employee.name}</h1>
            <p className="text-sm font-medium text-slate-500">{employee.role}</p>
          </div>

          {hydrated && !report && !busy && (
            <button
              type="button"
              onClick={generate}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700"
            >
              Generate AI Review Draft
            </button>
          )}
        </div>
      </header>

      {/* Generation Stages */}
      {stage !== null && (
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs font-medium text-blue-900">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
            <span>{STAGES[stage]}...</span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="no-print mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <p className="font-semibold">Action Refused by System</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => (report ? setError(null) : generate())}
            className="mt-3 rounded border border-rose-300 bg-white px-3 py-1 font-semibold text-rose-700 hover:bg-rose-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {report && (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Main Review Sections (Left 2 Columns) */}
          <div className="space-y-8 lg:col-span-2">
            {SECTIONS.map(({ key, title, note }) => (
              <section key={key} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                  <span className="text-xs text-slate-400 font-medium">{note}</span>
                </div>

                {report[key].length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No points drafted for this section.</p>
                ) : (
                  <div className="space-y-4">
                    {report[key].map((claim, i) => (
                      <ClaimRow
                        key={i}
                        claim={claim}
                        sources={claimSources(claim)}
                        canEdit={canEdit}
                        edited={claim.text !== original?.[key][i]?.text}
                        onChange={(text) => editClaim(key, i, text)}
                        onCite={setDrawer}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Bias & Compliance Sidebar (Right Column) */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sticky top-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
                Bias Audit Summary
              </h2>

              <div className="mt-4 flex gap-2 font-mono text-xs">
                {counts.high > 0 && (
                  <span className="rounded bg-rose-50 border border-rose-200 px-2 py-1 text-rose-800 font-semibold">
                    {counts.high} High
                  </span>
                )}
                {counts.medium > 0 && (
                  <span className="rounded bg-amber-50 border border-amber-200 px-2 py-1 text-amber-800 font-semibold">
                    {counts.medium} Medium
                  </span>
                )}
                {counts.low > 0 && (
                  <span className="rounded bg-slate-100 border border-slate-200 px-2 py-1 text-slate-700 font-semibold">
                    {counts.low} Low
                  </span>
                )}
                {counts.high === 0 && counts.medium === 0 && counts.low === 0 && (
                  <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-1 text-emerald-800 font-semibold">
                    No Flags Raised
                  </span>
                )}
              </div>

              <p className="mt-4 text-xs leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {report.overall_bias_summary}
              </p>

              {!locked && (
                <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
                  <p className="font-semibold">Human-in-the-Loop Requirement:</p>
                  <p className="mt-1 text-blue-800 leading-normal">
                    Approval is blocked while high-severity flags remain unedited. Click &quot;Edit Claim&quot; on any flagged item to resolve it.
                  </p>
                </div>
              )}

              {locked && (
                <div className="mt-4 rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
                  <p className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">Decision Recorded</p>
                  <p className="mt-1 font-medium">{report.status.toUpperCase()} by {report.reviewer}</p>
                  {report.approved_at && <p className="text-[11px] text-slate-500">{report.approved_at}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Decision Bar */}
      {report && (
        <div className="no-print fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <span className="text-xs font-semibold text-slate-600">
              {locked
                ? `Status: ${report.status.replace("_", " ").toUpperCase()}`
                : dirty
                  ? "Unsaved modifications present"
                  : "Awaiting reviewer decision"}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => submit("edit")}
                disabled={!dirty || busy || locked}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors enabled:hover:bg-slate-50 disabled:opacity-40"
              >
                Save Edits
              </button>
              <button
                type="button"
                onClick={() => submit("reject")}
                disabled={busy || locked}
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 shadow-xs transition-colors enabled:hover:bg-rose-100 disabled:opacity-40"
              >
                Reject Review
              </button>
              <button
                type="button"
                onClick={() => submit("approve")}
                disabled={busy || locked}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors enabled:hover:bg-blue-700 disabled:opacity-40"
              >
                {dirty ? "Approve With Edits" : "Approve Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SourceDrawer source={drawer} onClose={() => setDrawer(null)} />
    </main>
  );
}
