"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadAudit } from "@/lib/store";
import type { AuditEntry, Employee } from "@/lib/types";

const ACTION_LABEL = {
  generated: "Drafted",
  edit: "Edited",
  approve: "Approved",
  reject: "Rejected",
} as const;

const ACTION_BADGE = {
  generated: "bg-blue-50 text-blue-700 border-blue-200",
  edit: "bg-amber-50 text-amber-700 border-amber-200",
  approve: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reject: "bg-rose-50 text-rose-700 border-rose-200",
} as const;

export default function AuditClient({ employee }: { employee: Employee }) {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const id = employee.employee_id;

  useEffect(() => setEntries(loadAudit(id)), [id]);

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
      </header>

      {entries === null ? null : entries.length === 0 ? (
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
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Actor</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Details & Diffs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {e.ts}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                    {e.reviewer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${ACTION_BADGE[e.action]}`}>
                      {ACTION_LABEL[e.action]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs leading-relaxed text-slate-700">
                    {e.summary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
