"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import ClaimRow from "@/components/claim-row";
import SourceDrawer from "@/components/source-drawer";
import { biasPrecheck, raisedCount } from "@/lib/bias-precheck";
import { buildSourceMap, resolveSource } from "@/lib/sources";
import { evidenceLedger, flagCounts, totalFlags } from "@/lib/stats";
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
  flagLabel,
  pointRef,
  type ApproveBlocked,
  type ApproveResponse,
  type Claim,
  type EditedFields,
  type Employee,
  type InsufficientEvidence,
  type Report,
  type SectionKey,
  type Source,
} from "@/lib/types";

const STAGES = ["Reading feedback files", "Executing bias audit", "Finalizing review draft"];

// Backend keys for the evidence categories the gate can report as absent.
const MISSING_LABEL: Record<string, string> = {
  manager_feedback: "Manager feedback",
  peer_feedback: "Peer feedback",
  goals: "Goals",
  project_outcomes: "Project outcomes",
};

export default function ReviewClient({ employee }: { employee: Employee }) {
  const [hydrated, setHydrated] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [original, setOriginal] = useState<Report | null>(null);
  const [stage, setStage] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<Source | null>(null);
  const [blocked, setBlocked] = useState<ApproveBlocked | null>(null);
  const [acked, setAcked] = useState<string[]>([]);
  // Set when the backend's evidence gate declines to draft: too little
  // feedback on file. Renders what is missing instead of a report.
  const [insufficient, setInsufficient] = useState<InsufficientEvidence | null>(
    null,
  );
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [preview, setPreview] = useState(false);

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

  const counts = useMemo(() => flagCounts(report), [report]);
  const precheck = useMemo(() => biasPrecheck(employee), [employee]);
  const ledger = useMemo(
    () => (report ? evidenceLedger(report, sourceMap) : null),
    [report, sourceMap],
  );

  async function generate() {
    if (locked && !confirm("This review is already finalized. Replace it with a new draft?"))
      return;

    setBusy(true);
    setError(null);
    setInsufficient(null);
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

      // The evidence gate refused to draft — not an error, a finding.
      if ((data as { insufficient?: boolean }).insufficient) {
        // A refusal supersedes any stale browser-cached draft for this employee.
        clearEmployee(id);
        setReport(null);
        setOriginal(null);
        setInsufficient(data as InsufficientEvidence);
        return;
      }

      const next = data as Report;
      if (next.audit_status !== "complete") {
        throw new Error("The bias audit is incomplete. This draft cannot be reviewed or approved.");
      }
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
    setReport((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        [key]: prev[key].map((c, i) => (i === index ? { ...c, text } : c)),
      };
      // The backend has no "save draft" action, so edits persist locally as
      // they are typed. Without this a refresh would silently discard them.
      saveReport(id, next);
      return next;
    });
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

  // Every amendment that will be sent, paired with the wording it replaces —
  // the reviewer signs off on the diff, not on a remembered impression of it.
  function amendments() {
    if (!report || !original) return [];
    return SECTIONS.flatMap(({ key, title }) =>
      report[key]
        .map((c, i) => ({ ref: pointRef(key, i), title, from: original[key][i]?.text ?? "", to: c.text }))
        .filter((d) => d.from !== d.to),
    );
  }

  async function submit(action: "approved" | "rejected") {
    if (!report) return;
    setPreview(false);
    setBusy(true);
    setError(null);
    setBlocked(null);

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
          ...(carriesEdits ? { edits: fields } : {}),
          ...(acked.length ? { acknowledged_refs: acked } : {}),
        }),
      });
      const data = await res.json();

      // Not an error — the server is refusing to finalize a review whose
      // high-severity flags nobody has dealt with. Show what must be addressed.
      if (res.status === 422) {
        setBlocked(data as ApproveBlocked);
        return;
      }
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

      const verb = action === "approved" ? "Approved" : "Rejected";
      const notes = [
        carriesEdits ? `edits to ${diffSummary(fields)}` : null,
        acked.length
          ? `${acked.length} flag${acked.length === 1 ? "" : "s"} acknowledged`
          : null,
      ].filter(Boolean);

      appendAudit(id, {
        ts: new Date().toISOString(),
        reviewer: REVIEWER,
        action,
        report_id: report.report_id,
        summary: notes.length
          ? `${verb} with ${notes.join(" and ")}`
          : `${verb} as drafted`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const claimSources = (claim: Claim) =>
    claim.source_ids.map((sid) => resolveSource(sourceMap, sid));

  const visible = (list: Claim[]) =>
    list
      .map((claim, i) => ({ claim, i }))
      .filter(({ claim }) => !flaggedOnly || claim.flag);

  return (
    <div className="app-shell">
      <AppHeader />
      {/* Same box as .desk-page, but as utilities — .desk-page h1 would beat
          this page's own heading sizes on specificity. */}
      <main className="mx-auto w-[min(1060px,100%)] px-10 py-14 pb-32">
      {/* Top Nav */}
      <nav className="no-print mb-6 flex items-center justify-end gap-4 border-b border-slate-200 pb-4 text-xs font-semibold text-slate-500">
          {report && (
            <button
              type="button"
              // Print the whole review, never the filtered view — a saved PDF
              // that silently omits the unflagged claims is not the report.
              onClick={() => {
                setFlaggedOnly(false);
                setTimeout(() => window.print(), 0);
              }}
              className="font-semibold hover:text-slate-900 transition-colors"
            >
              Print / Save as PDF
            </button>
          )}
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

      {/* Input evidence check — arithmetic on the source file, no model
          involved, so it stands whether or not the draft has been generated. */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Evidence balance check
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            Computed from the source file · no AI
          </p>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          {raisedCount(precheck) === 0
            ? "The feedback on file is spread across several people and months. Nothing here suggests the evidence itself is skewed."
            : `${raisedCount(precheck)} of ${precheck.length} balance checks are outside the expected range. These describe the input, not the draft — the audit below judges the wording.`}
        </p>

        <ul className="mt-4 space-y-3">
          {precheck.map((s) => (
            <li
              key={s.id}
              className={`rounded-lg border p-3 ${
                s.raised
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs font-semibold text-slate-900">{s.label}</p>
                <span
                  className={`shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                    s.raised ? "text-amber-800" : "text-slate-400"
                  }`}
                >
                  {s.raised ? "Outside range" : "Within range"}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{s.detail}</p>
              {s.refs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.refs.map((sid) => (
                    <button
                      key={sid}
                      type="button"
                      onClick={() => setDrawer(resolveSource(sourceMap, sid))}
                      className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600 hover:border-slate-500 hover:text-slate-900"
                    >
                      {sid}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

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

      {insufficient && !report && (
        <section className="no-print mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-xs">
          <p className="text-sm font-bold uppercase tracking-wider text-amber-900">
            Not enough evidence to draft a review
          </p>
          <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-amber-900">
            {insufficient.message}
          </p>

          {insufficient.missing.length > 0 && (
            <div className="mt-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-amber-800">
                Missing from the file
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {insufficient.missing.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-amber-300 bg-white px-3 py-1 font-mono text-[11px] font-semibold text-amber-900"
                  >
                    {MISSING_LABEL[m] ?? m.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-amber-800">
            A fair review needs at least two independent reviewer voices and
            one objective record — a goal or a project outcome. The system
            declines to draft rather than invent one. Collect the missing
            feedback, then generate again.
          </p>

          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="mt-5 rounded-lg border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-40"
          >
            Check again
          </button>
        </section>
      )}

      {blocked && (
        <section className="no-print mt-10 border-2 border-rose-400 bg-rose-50 p-7">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-rose-700">
            Approval refused &middot; {blocked.unresolved_count} high-severity
            flag
            {blocked.unresolved_count === 1 ? "" : "s"} unaddressed
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed">
            {blocked.detail}
          </p>

          <ul className="mt-6 divide-y divide-rule border-t border-rule">
            {blocked.unresolved.map((u) => {
              const done = acked.includes(u.point_ref);
              return (
                <li key={u.point_ref} className="py-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-graphite">
                    {u.point_ref} &middot; {flagLabel(u.type)}
                  </p>
                  <p className="mt-2 text-[16px] leading-relaxed">{u.text}</p>
                  <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-graphite">
                    {u.reasoning}
                  </p>
                  <button
                    type="button"
                    disabled={done || busy}
                    onClick={() => {
                      setAcked((p) => [...p, u.point_ref]);
                      appendAudit(id, {
                        ts: new Date().toISOString(),
                        reviewer: REVIEWER,
                        action: "acknowledged",
                        report_id: report!.report_id,
                        summary: `Acknowledged ${flagLabel(u.type).toLowerCase()} at ${u.point_ref} without amending it`,
                      });
                    }}
                    className="mt-4 border border-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] enabled:hover:bg-ink enabled:hover:text-sheet disabled:border-rule disabled:text-graphite"
                  >
                    {done ? "Acknowledged" : "Acknowledge flag after review"}
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mt-5 max-w-3xl font-mono text-[10px] leading-relaxed uppercase tracking-[0.12em] text-graphite">
            Editing does not automatically resolve a model-raised issue. Review
            the amendment and explicitly acknowledge the original flag before
            approval. The amendment and acknowledgement are recorded separately.
          </p>
        </section>
      )}

      {report && (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Main Review Sections (Left 2 Columns) */}
          <div className="space-y-8 lg:col-span-2">
            {totalFlags(counts) > 0 && (
              <div className="no-print flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-xs">
                <p className="text-xs text-slate-500">
                  {totalFlags(counts)} of {ledger?.claimsTotal ?? 0} claims carry a flag.
                </p>
                <button
                  type="button"
                  onClick={() => setFlaggedOnly((v) => !v)}
                  aria-pressed={flaggedOnly}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    flaggedOnly
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {flaggedOnly ? "Showing flagged only" : "Show flagged only"}
                </button>
              </div>
            )}
            {SECTIONS.map(({ key, title, note }) => (
              <section key={key} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                  <span className="text-xs text-slate-400 font-medium">{note}</span>
                </div>

                {report[key].length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No points drafted for this section.</p>
                ) : visible(report[key]).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No flagged claims in this section.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Index into the unfiltered section — point_ref and edits
                        address the real position, not the visible one. */}
                    {visible(report[key]).map(({ claim, i }) => (
                      <ClaimRow
                        key={i}
                        claim={claim}
                        sources={claimSources(claim)}
                        canEdit={canEdit}
                        edited={claim.text !== original?.[key][i]?.text}
                        acknowledged={acked.includes(pointRef(key, i))}
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
                <span className={`rounded border px-2 py-1 font-semibold ${
                  report.audit_status === "complete"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}>
                  Audit {report.audit_status}
                </span>
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

              {ledger && (
                <p className="mt-3 font-mono text-[10px] leading-relaxed text-slate-500">
                  {report.audited_claims ?? ledger.claimsTotal} of {ledger.claimsTotal} claims audited · {ledger.sourcesCited} of {ledger.sourcesOnFile} sources on file cited · {ledger.claimsWithoutCitation} claims without a citation · {report.stripped_uncited_count} uncited model claim{report.stripped_uncited_count === 1 ? "" : "s"} removed
                  {ledger.unresolvedCitations.length > 0 &&
                    ` · ${ledger.unresolvedCitations.length} citation${ledger.unresolvedCitations.length === 1 ? "" : "s"} match no source`}
                </p>
              )}

              {!locked && (
                <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
                  <p className="font-semibold">Human-in-the-Loop Requirement:</p>
                  <p className="mt-1 text-blue-800 leading-normal">
                    Approval is blocked until every high-severity flag is explicitly reviewed and acknowledged. Editing alone does not clear a flag.
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
          <div className="mx-auto flex w-[min(1060px,100%)] items-center justify-between px-10 py-3">
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
                onClick={() => submit("rejected")}
                disabled={busy || locked}
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 shadow-xs transition-colors enabled:hover:bg-rose-100 disabled:opacity-40"
              >
                Reject Review
              </button>
              <button
                type="button"
                onClick={() => setPreview(true)}
                disabled={busy || locked || report.audit_status !== "complete"}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors enabled:hover:bg-blue-700 disabled:opacity-40"
              >
                {dirty ? "Review Edits & Approve" : "Approve Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {preview && report && (
        <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
          <div role="dialog" aria-modal="true" aria-label="Confirm approval" className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              What will be recorded
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Approving sends this to the review service under your name, {REVIEWER}. Nothing else about the draft changes.
            </p>

            <h3 className="mt-5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              Amendments · {amendments().length}
            </h3>
            {amendments().length === 0 ? (
              <p className="mt-1 text-xs italic text-slate-400">None. The draft is approved exactly as the model wrote it.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {amendments().map((d) => (
                  <li key={d.ref} className="rounded-lg border border-slate-200 p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{d.ref} · {d.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400 line-through">{d.from}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-800">{d.to}</p>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="mt-5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              Flags acknowledged without amendment · {acked.length}
            </h3>
            {acked.length === 0 ? (
              <p className="mt-1 text-xs italic text-slate-400">None.</p>
            ) : (
              <p className="mt-1 font-mono text-xs text-slate-700">{acked.join(", ")}</p>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setPreview(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => submit("approved")}
                disabled={busy}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white transition-colors enabled:hover:bg-blue-700 disabled:opacity-40"
              >
                Send approval
              </button>
            </div>
          </div>
        </div>
      )}

      <SourceDrawer source={drawer} onClose={() => setDrawer(null)} />
      </main>
    </div>
  );
}
