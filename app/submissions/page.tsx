import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { employees } from "@/data/employees";
import { buildSourceMap, KIND_LABEL } from "@/lib/sources";

// A "submission" here is one piece of feedback somebody filed about an
// employee — the only thing in this product anyone actually submits.
const rows = employees
  .flatMap((e) =>
    Object.values(buildSourceMap(e))
      .filter((s) => s.reviewer)
      .map((s) => ({ ...s, employee: e.name, employeeId: e.employee_id })),
  )
  .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

const tone = (kind: string) => (kind === "manager" ? "pending-audit" : kind === "peer" ? "under-review" : "new");

export default function SubmissionsPage() {
  return <div className="app-shell"><AppHeader /><main className="submissions-layout">
    <section className="page-content">
      <div className="page-intro"><div><h1>Feedback on file</h1></div><div className="cycle-card"><span>▣</span><div><small>Entries</small><strong>{rows.length} across {employees.length}</strong></div></div></div>
      <p className="page-lede">Every entry a review can cite. Each carries the id the draft references, so a claim can always be traced back to the sentence it came from.</p>
      <div><div className="submission-head"><span>Source id</span><span>What was written</span><span>Author</span><span>About</span><span>Date</span></div>{rows.map((r) => <article className="submission-row" key={`${r.employeeId}-${r.id}`}><span className="font-mono text-[13px]">{r.id}</span><strong>{r.text}</strong><span>{r.reviewer}</span><span><Link href={`/review/${r.employeeId}`}>{r.employee}</Link></span><span><i className={`pill ${tone(r.kind)}`}>{r.date ?? KIND_LABEL[r.kind]}</i></span></article>)}</div>
    </section>
  </main></div>;
}
