import { AppHeader } from "@/components/app-header";

const reports = [["H1 2026 integrity report", "Completed Aug 12, 2026", "92.4% evidence coverage"], ["Language bias scan", "Completed Aug 11, 2026", "4 items need review"], ["Reviewer consistency report", "Completed Aug 08, 2026", "Target variance: 5%"]];

export default function AuditReportsPage() {
  return <div className="app-shell"><AppHeader /><main className="desk-page"><p className="eyebrow">Review desk</p><h1>Audit reports</h1><p className="page-lede">Trace evidence quality, reviewer consistency, and language-bias checks.</p><section className="report-grid">{reports.map(([title, date, note]) => <article className="report-card" key={title}><span className="report-icon">▣</span><p>{date}</p><h2>{title}</h2><strong>{note}</strong><button>View report →</button></article>)}</section></main></div>;
}
