import Link from "next/link";
import { employees } from "@/data/employees";
import { REVIEWER } from "@/lib/types";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10 rounded-xl border border-slate-200 bg-white p-8 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
            Review Cycle H1 2026
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Reviewer: {REVIEWER}
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          Bias-Aware 360° Review System
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Synthesize 360-degree feedback into evidence-cited performance reviews with automated bias detection and mandatory human-in-the-loop approval.
        </p>
      </header>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Select Employee ({employees.length} Pending Draft)
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {employees.map((e) => (
          <Link
            key={e.employee_id}
            href={`/review/${e.employee_id}`}
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-slate-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-600">
                  {e.employee_id}
                </span>
                <span className="text-xs text-slate-400">Ready</span>
              </div>
              <h3 className="mt-3 text-xl font-bold text-slate-900 group-hover:text-blue-600">
                {e.name}
              </h3>
              <p className="text-xs font-medium text-slate-500">{e.role}</p>

              <div className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Manager Feedback</span>
                  <span className="font-semibold text-slate-800">{e.manager_feedback.length} entries</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Peer Feedback</span>
                  <span className="font-semibold text-slate-800">{e.peer_feedback.length} entries</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Goals Defined</span>
                  <span className="font-semibold text-slate-800">{e.goals.length} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Project Outcomes</span>
                  <span className="font-semibold text-slate-800">{e.project_outcomes.length} projects</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-blue-600 group-hover:underline">
              <span>Open Review Workspace</span>
              <span>&rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
