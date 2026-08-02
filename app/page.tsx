import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { employees } from "@/data/employees";
import { mockReport } from "@/data/mock-report";
import { buildSourceMap } from "@/lib/sources";
import { evidenceLedger, flagCounts, pct, totalFlags } from "@/lib/stats";
import { REVIEWER } from "@/lib/types";

type Counts = ReturnType<typeof flagCounts>;

// Every figure on this page traces to a captured report; nothing is estimated.
function rows() {
  return employees.map((employee) => {
    const report = mockReport(employee.employee_id);
    const counts = flagCounts(report);
    return { employee, counts, flagged: totalFlags(counts), ledger: report && evidenceLedger(report, buildSourceMap(employee)) };
  });
}

const flagMix = (c: Counts) => (["high","medium","low"] as const).filter((k)=>c[k]).map((k)=>`${c[k]} ${k}`).join(" · ") || "No flags raised";

export default function Home() {
  const all = rows();
  const sum = (f:(r:ReturnType<typeof rows>[number])=>number) => all.reduce((n,r)=>n+f(r),0);
  const claimsTotal = sum((r)=>r.ledger?.claimsTotal ?? 0), flagged = sum((r)=>r.flagged), high = sum((r)=>r.counts.high), uncited = sum((r)=>r.ledger?.claimsWithoutCitation ?? 0);
  return <div className="dashboard-shell flex">
    <aside className="sidebar sticky top-0 hidden h-screen shrink-0 flex-col p-4 md:flex">
      <div className="px-3 pb-10 pt-2"><p className="font-display text-2xl font-semibold tracking-tight">Review Desk</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[.16em] text-graphite">Senior editor</p></div>
      <nav className="space-y-2 font-mono text-xs font-bold"><a className="nav-link-active flex gap-3 px-4 py-3" href="#overview">▦ Dashboard</a><a className="nav-link flex gap-3 px-4 py-3" href="#reviews">✎ Pending drafts</a><Link className="nav-link flex gap-3 px-4 py-3" href="/audit-reports">◫ Audit reports</Link><Link className="nav-link flex gap-3 px-4 py-3" href="/cycle-archive">◷ Cycle archive</Link><Link className="nav-link flex gap-3 px-4 py-3" href="/governance">⚖ Governance</Link></nav>
      <div className="mt-auto border-t border-rule pt-5"><a href="#reviews" className="block rounded-lg bg-ink px-4 py-3 text-center font-mono text-xs font-bold text-sheet">+ New review</a><p className="px-3 pt-6 font-mono text-[10px] uppercase tracking-[.13em] text-graphite">Help center</p></div>
    </aside>
    <main className="min-w-0 flex-1">
      <AppHeader />
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-12" id="overview">
        <section className="mb-11 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-graphite">Review cycle H1 2026 · {REVIEWER}</p><h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">Editorial overview</h1><p className="mt-3 max-w-2xl text-graphite">There are <strong className="text-[#b65607] dark:text-[#ffb36d]">{employees.length} reviews</strong> requiring evidence-based editorial attention this cycle.</p></div><div className="dash-card flex items-center gap-3 px-5 py-3"><span className="text-xl text-[#b65607]">▣</span><div><p className="font-mono text-[10px] uppercase tracking-wider text-graphite">Active cycle</p><p className="font-semibold">August 2026</p></div></div></section>
        <section className="mb-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"><Metric icon="▤" label="Drafts in this cycle" value={`${all.length}`} note={`${claimsTotal} claims`} good/><Metric icon="◷" label="Claims flagged" value={`${flagged}`} note={`of ${claimsTotal}`}/><Metric icon="✓" label="Citation coverage" value={pct(claimsTotal?(claimsTotal-uncited)/claimsTotal:0)} note={`${uncited} uncited`} good={uncited===0}/><Metric icon="◴" label="High-severity open" value={`${high}`} note={high?"Blocks approval":"None open"} good={high===0}/></section>
        <div className="grid gap-10 lg:grid-cols-3"><section className="space-y-6 lg:col-span-2" id="reviews"><div className="flex items-center justify-between"><h2 className="font-display text-2xl font-semibold">Recent review submissions</h2><Link href="/drafts" className="font-mono text-[11px] font-bold text-graphite">View all →</Link></div><div className="grid gap-5 md:grid-cols-2">{all.map(({employee,counts,flagged})=><ReviewCard key={employee.employee_id} employee={employee} counts={counts} flagged={flagged}/>)}</div></section><aside className="space-y-8" id="activity"><section><h2 className="mb-5 font-display text-xl font-semibold">System log</h2><div className="dash-card divide-y divide-rule p-5">{all.map(({employee,flagged,ledger})=><Log key={employee.employee_id} title={`Draft generated · ${employee.name}`} time={ledger?`${ledger.sourcesCited}/${ledger.sourcesOnFile} sources cited`:"no draft"} text={`${ledger?.claimsTotal ?? 0} claims synthesised · ${flagged} flagged for review.`}/>)}</div></section><section className="dash-card p-5"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-graphite">Quick actions</p><div className="mt-4 grid grid-cols-2 gap-3"><Link href="/reviewers" className="rounded border border-rule p-4 text-center font-mono text-[11px] font-bold hover:bg-paper">⌕<br/>Reviewers</Link><Link href="/audit-reports" className="rounded border border-rule p-4 text-center font-mono text-[11px] font-bold hover:bg-paper">◫<br/>Audit reports</Link></div></section></aside></div>
      </div>
    </main>
  </div>;
}

function Metric({icon,label,value,note,good=false}:{icon:string;label:string;value:string;note:string;good?:boolean}) { return <div className="dash-card p-5 transition"><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center rounded bg-paper text-lg">{icon}</span><span className={`rounded px-2 py-1 font-mono text-[10px] font-bold ${good?"bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300":"bg-orange-100 text-[#a84d04] dark:bg-orange-950 dark:text-orange-200"}`}>{note}</span></div><p className="mt-5 font-mono text-[11px] text-graphite">{label}</p><p className="mt-1 font-display text-3xl font-semibold">{value}</p></div>; }
// There is no rating anywhere in this product's data, so the card shows the
// flag mix the audit actually produced in place of the usual score bar.
function ReviewCard({employee,counts,flagged}:{employee:(typeof employees)[number];counts:Counts;flagged:number}) { return <Link href={`/review/${employee.employee_id}`} className="dash-card block p-6 transition"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#dce4ec] font-display text-lg text-[#16202b]">{employee.name.slice(0,1)}</span><div><h3 className="font-display text-lg font-semibold">{employee.name}</h3><p className="text-sm italic text-graphite">{employee.role}</p></div></div><div className="mt-6"><div className="flex justify-between font-mono text-[11px]"><span className="text-graphite">Bias audit</span><strong className={counts.high?"text-[#b3261e] dark:text-[#ff9a94]":undefined}>{flagMix(counts)}</strong></div><p className="mt-5 line-clamp-3 text-[15px] leading-6 text-graphite">“{employee.peer_feedback[0]?.text ?? employee.self_assessment}”</p></div><div className="mt-6 flex items-center justify-between border-t border-rule pt-5"><span className="rounded-full bg-paper px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-wider">{counts.high?"Approval blocked":flagged?"Review flags":"Pending sign-off"}</span><span className="font-mono text-[11px] font-bold text-[#b65607] dark:text-[#ffb36d]">Review details →</span></div></Link>; }
function Log({title,time,text}:{title:string;time:string;text:string}) { return <div className="py-4 first:pt-0 last:pb-0"><div className="flex justify-between gap-2"><p className="font-semibold">{title}</p><span className="shrink-0 font-mono text-[9px] uppercase text-graphite">{time}</span></div><p className="mt-1 text-sm text-graphite">{text}</p></div>; }
