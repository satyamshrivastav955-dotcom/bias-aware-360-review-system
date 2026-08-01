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

export default function AuditClient({ employee }: { employee: Employee }) {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const id = employee.employee_id;

  useEffect(() => setEntries(loadAudit(id)), [id]);

  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-24">
      <nav className="mb-10 font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
        <Link href={`/review/${id}`} className="hover:text-ink">
          &larr; Back to review
        </Link>
      </nav>

      <header className="border-b border-rule pb-8">
        <p className="font-mono text-[11px] tracking-wider text-graphite">{id}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Audit trail
        </h1>
        <p className="mt-2 max-w-xl text-graphite">
          Every action taken on {employee.name}&rsquo;s review, in order.
        </p>
      </header>

      {entries === null ? null : entries.length === 0 ? (
        <div className="mt-12 border border-rule bg-sheet p-10 text-center">
          <p className="text-graphite">
            Nothing recorded yet. The trail starts when a review is drafted.
          </p>
          <Link
            href={`/review/${id}`}
            className="mt-6 inline-block border border-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] hover:bg-ink hover:text-sheet"
          >
            Open the review
          </Link>
        </div>
      ) : (
        <table className="mt-12 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-rule font-mono text-[11px] uppercase tracking-[0.12em] text-graphite">
              <th className="py-3 pr-6 font-normal">When</th>
              <th className="py-3 pr-6 font-normal">Who</th>
              <th className="py-3 pr-6 font-normal">Action</th>
              <th className="py-3 font-normal">Detail</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i} className="border-b border-rule align-top">
                <td className="py-4 pr-6 font-mono text-[11px] whitespace-nowrap text-graphite">
                  {e.ts}
                </td>
                <td className="py-4 pr-6 text-[15px]">{e.reviewer}</td>
                <td className="py-4 pr-6 font-mono text-[11px] uppercase tracking-[0.12em]">
                  {ACTION_LABEL[e.action]}
                </td>
                <td className="py-4 text-[15px]">{e.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
