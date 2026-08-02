import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { employees } from "@/data/employees";
import { KIND_LABEL } from "@/lib/sources";
import { contributors, pct } from "@/lib/stats";

// Reviewer strings in the files are "Manager A (Vikram Rao)" / "Peer I (Rohan,
// Product Manager)" — the person is the parenthetical, before any comma.
const initials = (r: string) => ((r.match(/\(([^)]+)\)/)?.[1] ?? r).split(",")[0] ?? r).trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const range = (first: string | null, last: string | null) => (!first || !last ? "undated" : first === last ? first : `${first}–${last}`);

function cards() {
  return employees.flatMap((employee) => contributors(employee).filter((c) => c.reviewer !== employee.name).map((c) => ({ employee, c, quote: [...employee.manager_feedback, ...employee.peer_feedback].find((f) => f.reviewer === c.reviewer)?.text ?? "" })));
}

export default function ReviewersPage() {
  const all = cards();
  return <div className="app-shell"><AppHeader /><main className="directory-page"><h1>Reviewers Directory</h1><section className="reviewer-grid">{all.map(({ employee, c, quote }, index) => <article className="reviewer-card" key={`${employee.employee_id}-${c.reviewer}`}><div className="reviewer-heading"><span className={`reviewer-avatar avatar-${index % 4}`}>{initials(c.reviewer)}</span><div><h2>{c.reviewer}</h2><p>{c.kinds.map((k) => KIND_LABEL[k]).join(" · ")}</p></div></div><div className="reviewer-detail"><span>Reviewed</span><b><Link href={`/review/${employee.employee_id}`}>{employee.name} · {employee.employee_id}</Link></b></div><div className="reviewer-score"><div><span>{c.entries} {c.entries === 1 ? "entry" : "entries"} · {range(c.first, c.last)}</span><strong>{pct(c.share)} of file</strong></div><i><em style={{ width: pct(c.share) }} /></i></div><p className="reviewer-quote">“{quote.length > 116 ? `${quote.slice(0, 116).trimEnd()}…` : quote}”</p></article>)}</section></main></div>;
}
