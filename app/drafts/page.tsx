import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { employees } from "@/data/employees";
import { mockReport } from "@/data/mock-report";
import { flagCounts, totalFlags } from "@/lib/stats";

export default function DraftsPage() {
  const drafts = employees.map((employee) => { const counts = flagCounts(mockReport(employee.employee_id)); return { employee, counts, flagged: totalFlags(counts) }; });
  return <div className="app-shell"><AppHeader /><main className="desk-page"><p className="eyebrow">Review desk</p><h1>Pending drafts</h1><p className="page-lede">Finish the evidence review before sending each report for approval.</p><section className="work-list">{drafts.map(({ employee, counts, flagged }) => <article key={employee.employee_id} className="work-row"><div><h2>{employee.name}</h2><p>{employee.role} · {employee.employee_id}</p></div><span className="work-status">{flagged === 0 ? "No flags raised" : `${flagged} flagged${counts.high ? ` · ${counts.high} high` : ""}`}</span><Link href={`/review/${employee.employee_id}`} className="work-action">Open draft →</Link></article>)}</section></main></div>;
}
