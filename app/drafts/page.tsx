import Link from "next/link";
import { AppHeader } from "@/components/app-header";

const drafts = [
  ["Priya Sharma", "Performance review — H1 2026", "Edited 10 minutes ago", "Needs evidence check"],
  ["Rohan Verma", "Performance review — H1 2026", "Edited 2 hours ago", "Audit required"],
  ["Meera Joshi", "Performance review — H1 2026", "Edited yesterday", "Ready for approval"],
];

export default function DraftsPage() {
  return <div className="app-shell"><AppHeader /><main className="desk-page"><p className="eyebrow">Review desk</p><h1>Pending drafts</h1><p className="page-lede">Finish the evidence review before sending each report for approval.</p><section className="work-list">{drafts.map(([name, title, edited, status]) => <article key={name} className="work-row"><div><h2>{title}</h2><p>{name} · {edited}</p></div><span className="work-status">{status}</span><Link href="/review/emp_001" className="work-action">Open draft →</Link></article>)}</section></main></div>;
}
