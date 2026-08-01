import Link from "next/link";
import { employees } from "@/data/employees";
import { REVIEWER } from "@/lib/types";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <header className="mb-16 border-b border-rule pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-graphite">
          Review cycle H1 2026 &middot; signed in as {REVIEWER}
        </p>
        <h1 className="mt-5 max-w-2xl font-display text-4xl leading-[1.1] font-semibold tracking-tight md:text-5xl">
          Every claim carries its evidence.
        </h1>
        <p className="mt-5 max-w-xl text-graphite">
          Draft a 360&deg; review from the feedback on file. Each statement is
          cited back to a source, audited for bias, and held for your approval
          before it becomes final.
        </p>
      </header>

      <h2 className="mb-6 font-mono text-[11px] uppercase tracking-[0.18em] text-graphite">
        {employees.length} reviews awaiting draft
      </h2>

      <ul className="grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
        {employees.map((e) => (
          <li key={e.employee_id}>
            <Link
              href={`/review/${e.employee_id}`}
              className="group flex h-full flex-col bg-sheet p-7 transition-colors hover:bg-white"
            >
              <span className="font-mono text-[11px] tracking-wider text-graphite">
                {e.employee_id}
              </span>
              <span className="mt-4 font-display text-2xl leading-tight font-semibold">
                {e.name}
              </span>
              <span className="mt-1 text-[15px] text-graphite">{e.role}</span>

              <dl className="mt-7 space-y-1.5 border-t border-rule pt-5 font-mono text-[11px] text-graphite">
                <div className="flex justify-between">
                  <dt>manager notes</dt>
                  <dd>{e.manager_feedback.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>peer notes</dt>
                  <dd>{e.peer_feedback.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>goals</dt>
                  <dd>{e.goals.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>projects</dt>
                  <dd>{e.project_outcomes.length}</dd>
                </div>
              </dl>

              <span className="mt-7 font-mono text-[11px] uppercase tracking-[0.14em] text-ink underline decoration-rule underline-offset-4 group-hover:decoration-ink">
                Open review &rarr;
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
