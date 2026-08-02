"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { employees } from "@/data/employees";
import { loadReport } from "@/lib/store";
import type { Report, ServerAuditEntry } from "@/lib/types";

type Decided = {
  employee: (typeof employees)[number];
  status: "approved" | "rejected";
  reviewer: string;
  at: string;
};

async function serverDecision(employee: (typeof employees)[number]): Promise<Decided | null> {
  try {
    const res = await fetch(`/api/audit-trail?employee_id=${encodeURIComponent(employee.employee_id)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { entries?: ServerAuditEntry[] };
    const entry = data.entries?.find((item) => item.report_status === "approved" || item.report_status === "rejected");
    if (!entry || (entry.report_status !== "approved" && entry.report_status !== "rejected")) return null;
    return { employee, status: entry.report_status, reviewer: entry.actor, at: entry.at };
  } catch {
    return null;
  }
}

export default function CycleArchivePage() {
  const [decided, setDecided] = useState<Decided[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const serverRows = await Promise.all(employees.map(serverDecision));
      const remote = serverRows.filter((row): row is Decided => !!row);
      if (remote.length > 0) {
        if (!cancelled) setDecided(remote);
        return;
      }

      // Offline mode has no server audit endpoint, so retain the captured
      // local journey as a fallback for the demo.
      const local = employees
        .map((employee) => ({ employee, report: loadReport(employee.employee_id) }))
        .filter((row): row is { employee: (typeof employees)[number]; report: Report } =>
          !!row.report && (row.report.status === "approved" || row.report.status === "rejected"),
        )
        .map(({ employee, report }) => ({
          employee,
          status: report.status === "approved" ? "approved" as const : "rejected" as const,
          reviewer: report.reviewer ?? "unattributed",
          at: report.approved_at ?? report.created_at,
        }));
      if (!cancelled) setDecided(local);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return <div className="app-shell"><AppHeader /><main className="desk-page"><p className="eyebrow">Review desk</p><h1>Cycle archive</h1><p className="page-lede">Reviews approved or rejected in this cycle, read from the server audit trail when available.</p>{decided === null ? <p className="page-lede">Loading decisions…</p> : decided.length === 0 ? <section className="work-list"><article className="work-row"><div><h2>No decided reviews yet</h2><p>The archive fills as you approve or reject drafts. All {employees.length} employees in this cycle are still pending.</p></div><Link href="/drafts" className="work-action">Open pending drafts →</Link></article></section> : <section className="work-list">{decided.map(({ employee, status, reviewer, at }) => <article key={employee.employee_id} className="work-row"><div><h2>{employee.name}</h2><p>{employee.role} · {reviewer} · {at}</p></div><span className="work-status archive-status">{status === "approved" ? "Approved" : "Rejected"}</span><Link href={`/audit/${employee.employee_id}`} className="work-action">View audit trail →</Link></article>)}</section>}</main></div>;
}
