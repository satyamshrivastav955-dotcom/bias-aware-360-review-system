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
          Every action taken on {employee.name}&rsquo;s review, newest first.
        </p>
        {rows?.length ? (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-graphite">
            {source === "server"
              ? "Read from the review service"
              : "Read from this browser — the service was unreachable"}
          </p>
        ) : null}
      </header>

      {rows === null ? null : rows.length === 0 ? (
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
        <ol className="mt-12 divide-y divide-rule border-t border-rule">
          {rows.map((r, i) => (
            <li key={i} className="py-6">
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <span className="font-mono text-[11px] whitespace-nowrap text-graphite">
                  {r.ts}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em]">
                  {label(r.action)}
                </span>
                <span className="text-[15px]">{r.who}</span>
                <span className="text-[15px] text-graphite">{r.summary}</span>
              </div>

              {r.edits.map((e) => (
                <div key={e.point_ref} className="mt-4 border-l-2 border-rule pl-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite">
                    {e.point_ref}
                  </p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-graphite line-through decoration-pen/60">
                    {e.before}
                  </p>
                  <p className="mt-1.5 text-[15px] leading-relaxed">{e.after}</p>
                </div>
              ))}

              {r.acknowledged.length > 0 && (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-graphite">
                  Acknowledged without amendment: {r.acknowledged.join(", ")}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
