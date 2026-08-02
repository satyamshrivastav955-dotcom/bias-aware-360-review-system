import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { employees } from "@/data/employees";
import { mockReport } from "@/data/mock-report";
import { claims, flagCounts, totalFlags } from "@/lib/stats";
import { flagLabel, type Report, type Severity } from "@/lib/types";

// One row per distinct flag label, so three flags of the same kind read as one
// finding with a count rather than three near-identical lines.
function byLabel(report: Report) {
  const m = new Map<string, Record<Severity, number>>();
  for (const c of claims(report)) if (c.flag) { const label = flagLabel(c.flag.type), g = m.get(label) ?? { high: 0, medium: 0, low: 0 }; g[c.flag.severity]++; m.set(label, g); }
  return [...m];
}

const mix = (g: Record<Severity, number>) => (["high", "medium", "low"] as const).filter((k) => g[k]).map((k) => `${g[k]} ${k}`).join(" · ");

export default function AuditReportsPage() {
  const rows = employees.map((employee) => { const report = mockReport(employee.employee_id); return { employee, report, findings: report ? byLabel(report) : [] }; });
  return <div className="app-shell"><AppHeader /><main className="desk-page"><p className="eyebrow">Review desk</p><h1>Audit reports</h1><p className="page-lede">The bias audit as it came back from the captured drafts — every flag and summary below is the model&rsquo;s own output, not a rollup.</p><section className="report-grid">{rows.map(({ employee, report, findings }) => { const counts = flagCounts(report), flagged = totalFlags(counts); return <article className="report-card" key={employee.employee_id}><span className="report-icon">▣</span><p>{employee.employee_id} · {employee.role}</p><h2>{employee.name}</h2><strong>{report ? (flagged ? `${flagged} claim${flagged === 1 ? "" : "s"} flagged · ${mix(counts)}` : "No flags raised") : "No draft captured"}</strong>{findings.length > 0 && <ul className="mt-4 space-y-1.5 font-mono text-[10px] leading-relaxed text-graphite">{findings.map(([label, g]) => <li key={label}>{label} — {mix(g)}</li>)}</ul>}{report && <div className="mt-4 text-[13px] leading-relaxed text-graphite">{report.overall_bias_summary}</div>}<Link href={`/review/${employee.employee_id}`} className="work-action mt-6 inline-block">View report →</Link></article>; })}</section></main></div>;
}
