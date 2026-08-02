import { AppHeader } from "@/components/app-header";

const cycles = [["H1 2026", "1,284 submissions", "Closed Aug 2026"], ["H2 2025", "1,168 submissions", "Closed Feb 2026"], ["H1 2025", "1,095 submissions", "Closed Aug 2025"]];

export default function CycleArchivePage() {
  return <div className="app-shell"><AppHeader /><main className="desk-page"><p className="eyebrow">Review desk</p><h1>Cycle archive</h1><p className="page-lede">Browse completed review cycles and their audit history.</p><section className="work-list">{cycles.map(([cycle, count, closed]) => <article key={cycle} className="work-row"><div><h2>{cycle}</h2><p>{count} · {closed}</p></div><span className="work-status archive-status">Archived</span><button className="work-action">View cycle →</button></article>)}</section></main></div>;
}
