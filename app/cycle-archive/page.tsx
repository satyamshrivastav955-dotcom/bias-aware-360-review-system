"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { employees } from "@/data/employees";
import { loadReport } from "@/lib/store";
import type { Report } from "@/lib/types";

export default function CycleArchivePage() {
  // localStorage is the only readable record of a decision — /api/audit-trail is
  // write-scoped per employee — so this reads after mount, never during SSR.
  const [decided, setDecided] = useState<{ employee: (typeof employees)[number]; report: Report }[] | null>(null);
  useEffect(() => { setDecided(employees.map((employee) => ({ employee, report: loadReport(employee.employee_id) })).filter((r): r is { employee: (typeof employees)[number]; report: Report } => !!r.report && r.report.status !== "pending_approval")); }, []);

  return <div className="app-shell"><AppHeader /><main className="desk-page"><p className="eyebrow">Review desk</p><h1>Cycle archive</h1><p className="page-lede">Reviews you have approved or rejected in this cycle. This product has run one cycle covering {employees.length} employees; there is no earlier history to browse.</p>{decided === null ? <p className="page-lede">Loading decisions…</p> : decided.length === 0 ? <section className="work-list"><article className="work-row"><div><h2>No decided reviews yet</h2><p>The archive fills as you approve or reject drafts. All {employees.length} reviews in this cycle are still pending.</p></div><Link href="/drafts" className="work-action">Open pending drafts →</Link></article></section> : <section className="work-list">{decided.map(({ employee, report }) => <article key={employee.employee_id} className="work-row"><div><h2>{employee.name}</h2><p>{employee.role} · {report.reviewer ?? "unattributed"}{report.approved_at ? ` · ${report.approved_at}` : ""}</p></div><span className="work-status archive-status">{report.status === "approved" ? "Approved" : "Rejected"}</span><Link href={`/audit/${employee.employee_id}`} className="work-action">View audit trail →</Link></article>)}</section>}</main></div>;
}
