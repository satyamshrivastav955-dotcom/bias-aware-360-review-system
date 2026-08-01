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
  flagLabel,
  pointRef,
  type ApproveBlocked,
  type ApproveResponse,
  type Claim,
  type EditedFields,
  type Employee,
  type Report,
  type SectionKey,
  type Severity,
  type Source,
} from "@/lib/types";

const STAGES = ["Reading the feedback", "Checking for bias", "Ready for review"];

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
    if (locked && !confirm("This review is already decided. Replace it with a new draft?"))
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

      // ponytail: one network call. The stages are timed, not measured —
      // they never claim "ready" before the response actually lands.
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

  async function submit(action: "approved" | "rejected") {
    if (!report) return;
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

      // Only now is it safe to write locally. An optimistic update here would
      // tell a reviewer their decision was recorded when it was not.
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

  return (
    <main className="mx-auto max-w-[80rem] px-6 pt-12 pb-40">
      <nav className="no-print mb-10 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
        <Link href="/" className="hover:text-ink">
          &larr; All reviews
        </Link>
        <Link href={`/audit/${id}`} className="hover:text-ink">
          Audit trail
        </Link>
      </nav>

      <header className="border-b border-rule pb-8">
        <p className="font-mono text-[11px] tracking-wider text-graphite">{id}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          {employee.name}
        </h1>
        <p className="mt-2 text-graphite">{employee.role}</p>

        {hydrated && !report && !busy && (
          <button
            type="button"
            onClick={generate}
            className="no-print mt-8 bg-ink px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-sheet hover:bg-black"
          >
            Draft the review
          </button>
        )}
      </header>

      {stage !== null && (
        <ol className="mt-10 space-y-3">
          {STAGES.map((label, i) => (
            <li
              key={label}
              className={`flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.14em] ${
                i <= stage ? "text-ink" : "text-rule"
              }`}
            >
              <span
                className={`h-px w-8 ${i < stage ? "bg-ink" : i === stage ? "animate-pulse bg-ink" : "bg-rule"}`}
              />
              {label}
            </li>
          ))}
        </ol>
      )}

      {error && (
        <div className="no-print mt-10 border-l-2 border-pen bg-sheet p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-pen">
            Draft not saved
          </p>
          <p className="mt-2 text-[15px]">{error}</p>
          <button
            type="button"
            onClick={() => (report ? setError(null) : generate())}
            className="mt-4 border border-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] hover:bg-ink hover:text-sheet"
          >
            {report ? "Dismiss" : "Try again"}
          </button>
        </div>
      )}

      {blocked && (
        <section className="no-print mt-10 border-2 border-pen bg-sheet p-7">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-pen">
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
                    {done ? "Acknowledged" : "Acknowledge as written"}
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mt-5 max-w-3xl font-mono text-[10px] leading-relaxed uppercase tracking-[0.12em] text-graphite">
            Amend a claim to resolve its flag, or acknowledge it to approve the
            wording as it stands. Either way the choice is recorded against your
            name.
          </p>
        </section>
      )}

      {report && (
        <>
        <div className="mt-12 border border-rule bg-sheet px-7 py-10 md:px-12 md:py-14">
          <section className="border-l-2 border-ink pl-5">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-graphite">
                Bias audit
              </h2>
              <p className="font-mono text-[11px] tracking-wider">
                {(["high", "medium", "low"] as const)
                  .filter((s) => counts[s])
                  .map((s) => `${counts[s]} ${s}`)
                  .join(" · ") || "no flags raised"}
              </p>
            </div>
            <p className="mt-4 max-w-3xl text-[16px] leading-relaxed">
              {report.overall_bias_summary}
            </p>
            {!locked && (
              <p className="no-print mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-graphite">
                Hover any claim to amend it before deciding
              </p>
            )}
          </section>

          {locked && (
            <p className="mt-6 border-l-2 border-ink pl-4 font-mono text-[11px] uppercase tracking-[0.14em]">
              {report.status === "approved" ? "Approved" : "Rejected"} by{" "}
              {report.reviewer}
              {report.approved_at ? ` · ${report.approved_at}` : ""}
            </p>
          )}

          {SECTIONS.map(({ key, title, note }) => (
            <section key={key} className="mt-14">
              <div className="flex items-baseline gap-4 border-b border-rule pb-3">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {title}
                </h2>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-graphite">
                  {note}
                </p>
              </div>

              {report[key].length === 0 ? (
                <p className="py-6 text-graphite">
                  Nothing drafted for this section.
                </p>
              ) : (
                <div className="divide-y divide-rule">
                  {report[key].map((claim, i) => (
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

          <div className="no-print fixed inset-x-0 bottom-0 border-t border-rule bg-sheet/95 backdrop-blur">
            <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-between gap-4 px-6 py-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
                {locked
                  ? `${report.status.replace("_", " ")} · no further action`
                  : busy
                    ? "Sending…"
                    : dirty
                      ? "Edits ready to send"
                      : "Awaiting your decision"}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => submit("rejected")}
                  disabled={busy || locked}
                  className="border border-pen px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-pen enabled:hover:bg-pen enabled:hover:text-sheet disabled:opacity-35"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => submit("approved")}
                  disabled={busy || locked}
                  className="bg-ink px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-sheet enabled:hover:bg-black disabled:opacity-35"
                >
                  {dirty ? "Approve with edits" : "Approve"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <SourceDrawer source={drawer} onClose={() => setDrawer(null)} />
    </main>
  );
}
