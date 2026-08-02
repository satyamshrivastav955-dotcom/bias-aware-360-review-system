import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { employees } from "@/data/employees";
import { mockReport } from "@/data/mock-report";
import { flagCounts, totalFlags } from "@/lib/stats";

export default function DraftsPage() {
  const drafts = employees.map((employee) => { const report = mockReport(employee.employee_id); const counts = flagCounts(report); return { employee, report, counts, flagged: totalFlags(counts) }; });
  return <div className="app-shell"><AppHeader /><main className="desk-page"><p className="eyebrow">Review desk</p><h1>Pending drafts</h1><p className="page-lede">Finish the evidence review before sending each report for approval.</p><section className="work-list">{drafts.map(({ employee, report, counts, flagged }) => <article key={employee.employee_id} className="work-row"><div><h2>{employee.name}</h2><p>{employee.role} · {employee.employee_id}</p></div><span className="work-status">{report ? (flagged === 0 ? "No flags raised" : `${flagged} flagged${counts.high ? ` · ${counts.high} high` : ""}`) : "Evidence incomplete"}</span><Link href={`/review/${employee.employee_id}`} className="work-action">{report ? "Open draft" : "Review evidence"} →</Link></article>)}</section></main></div>;
}
