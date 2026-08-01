"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadAudit } from "@/lib/store";
import type {
  AuditEntry,
  Employee,
  ServerAuditEntry,
} from "@/lib/types";

const ACTION_LABEL: Record<string, string> = {
  generated: "Drafted",
  acknowledged: "Acknowledged",
  approved: "Approved",
  rejected: "Rejected",
};

const label = (a: string) => ACTION_LABEL[a] ?? a.replace(/_/g, " ");

type Row = {
  ts: string;
  who: string;
  action: string;
  summary: string;
  edits: { point_ref: string; before: string; after: string }[];
  acknowledged: string[];
};

const fromServer = (e: ServerAuditEntry): Row => {
  const edits = e.diff?.edits ?? [];
  const acknowledged = e.diff?.acknowledged_refs ?? [];
  const parts = [
    edits.length ? `${edits.length} claim${edits.length === 1 ? "" : "s"} amended` : null,
    acknowledged.length
      ? `${acknowledged.length} flag${acknowledged.length === 1 ? "" : "s"} acknowledged`
      : null,
  ].filter(Boolean);
  return {
    ts: e.at,
    who: e.actor,
    action: e.action,
    summary: parts.length ? parts.join(" · ") : `Report ${e.report_id.slice(0, 8)}`,
    edits,
    acknowledged,
  };
};

const fromLocal = (e: AuditEntry): Row => ({
  ts: e.ts,
  who: e.reviewer,
  action: e.action,
  summary: e.summary,
  edits: [],
  acknowledged: [],
});

const ACTION_BADGE = {
  generated: "bg-blue-50 text-blue-700 border-blue-200",
  edit: "bg-amber-50 text-amber-700 border-amber-200",
  approve: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reject: "bg-rose-50 text-rose-700 border-rose-200",
} as const;

export default function AuditClient({ employee }: { employee: Employee }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [source, setSource] = useState<"server" | "local">("local");
  const id = employee.employee_id;

  useEffect(() => {
    let live = true;
    // Prefer the server's record: it is the authoritative one and carries the
    // before/after diff. The local copy is the offline fallback.
    fetch("/api/audit-trail")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { entries: ServerAuditEntry[] }) => {
        if (!live) return;
        const mine = d.entries.filter((e) => e.employee_id === id);
        if (!mine.length) throw new Error("empty");
        setRows(mine.map(fromServer));
        setSource("server");
      })
      .catch(() => live && setRows(loadAudit(id).map(fromLocal).reverse()));
    return () => {
      live = false;
    };
  }, [id]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <nav className="mb-6 border-b border-slate-200 pb-4 text-xs font-semibold text-slate-500">
        <Link href={`/review/${id}`} className="hover:text-slate-900 transition-colors">
          &larr; Back to Review Workspace
        </Link>
      </nav>

      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">
          {id}
        </span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Compliance Audit Trail &mdash; {employee.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Immutable log of all draft generations, reviewer edits, and final decisions.
        </p>
        {rows?.length ? (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
            {source === "server"
              ? "Read from the review service"
              : "Read from this browser — the service was unreachable"}
          </p>
        ) : null}
      </header>

      {rows === null ? null : rows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <p className="text-sm text-slate-500">
            No audit records found. The compliance log is initialized when a review draft is generated.
          </p>
          <Link
            href={`/review/${id}`}
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Open Review Workspace
          </Link>
        </div>
      ) : (
        <ol className="mt-8 divide-y divide-slate-200 border-t border-slate-200">
          {rows.map((r, i) => (
            <li key={i} className="py-6">
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
                  {r.ts}
                </span>
                <span className="font-mono text-xs uppercase tracking-wider font-semibold text-slate-700">
                  {label(r.action)}
                </span>
                <span className="text-sm font-medium text-slate-900">{r.who}</span>
                <span className="text-sm text-slate-600">{r.summary}</span>
              </div>

              {r.edits.map((e) => (
                <div key={e.point_ref} className="mt-4 border-l-2 border-slate-300 pl-4">
                  <p className="font-mono text-xs uppercase tracking-wider font-semibold text-slate-500">
                    {e.point_ref}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400 line-through">
                    {e.before}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-800">{e.after}</p>
                </div>
              ))}

              {r.acknowledged.length > 0 && (
                <p className="mt-3 font-mono text-xs uppercase tracking-wider text-slate-500">
                  Acknowledged without amendment: {r.acknowledged.join(", ")}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
      )}
    </main>
  );
}
