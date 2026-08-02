import { AppHeader } from "@/components/app-header";
import { evaluateCapturedReports } from "@/lib/evaluation";
import { flagLabel } from "@/lib/types";

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const score = (value: number) => value >= 0.8 ? "text-emerald-700" : value >= 0.6 ? "text-amber-700" : "text-rose-700";

export default function EvaluationPage() {
  const result = evaluateCapturedReports();
  const metrics = [
    ["Flag precision", result.overall.precision, "Of the claims flagged by the captured auditor, how many humans also labeled as problematic."],
    ["Flag recall", result.overall.recall, "Of the human-labeled problematic claims, how many the captured auditor found."],
    ["Flag F1", result.overall.f1, "Balanced summary of flag precision and recall."],
    ["Macro category F1", result.macroF1, "Equal-weight average across flag categories represented in benchmark v1."],
    ["Audit completeness", result.auditCompleteness, "Claims with a complete audit result rather than an omitted model answer."],
    ["Citation resolution", result.citationResolution, "Claims whose citation IDs resolve to source records on file."],
  ] as const;

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="desk-page">
        <p className="eyebrow">Agentic AI evaluation</p>
        <h1>Benchmark evidence</h1>
        <p className="page-lede">
          Human-adjudicated labels compared with captured model outputs on synthetic employee data. These are offline benchmark results, not live production metrics.
        </p>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Evaluation metrics">
          {metrics.map(([label, value, description]) => (
            <article key={label} className="report-card min-h-0">
              <p className="!mt-0">{result.benchmarkVersion} · {result.claims} claims</p>
              <strong className={`!mt-2 !text-3xl ${score(value)}`}>{pct(value)}</strong>
              <h2 className="!mt-2 !text-lg">{label}</h2>
              <div className="mt-3 text-sm leading-relaxed text-graphite">{description}</div>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-xl border border-[var(--editorial-rule)] bg-[var(--editorial-card)] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--editorial-rule)] pb-4">
            <div>
              <p className="eyebrow">Per-category performance</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">Where the auditor succeeds and fails</h2>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-graphite">
              {result.expectedFlagged} expected flags · {result.actualFlagged} predicted
            </p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[650px] border-collapse text-left text-sm">
              <thead className="font-mono text-[10px] uppercase tracking-wider text-graphite">
                <tr><th className="py-2">Category</th><th>Support</th><th>Precision</th><th>Recall</th><th>F1</th></tr>
              </thead>
              <tbody>
                {result.byType.map(({ type, support, metrics: m }) => (
                  <tr key={type} className="border-t border-[var(--editorial-rule)]">
                    <td className="py-3 font-semibold">{flagLabel(type)}</td>
                    <td>{support}</td><td>{support ? pct(m.precision) : "Not labeled"}</td><td>{support ? pct(m.recall) : "Not labeled"}</td><td className={support ? score(m.f1) : "text-graphite"}>{support ? pct(m.f1) : "Not labeled"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-[var(--editorial-rule)] bg-[var(--editorial-card)] p-6">
            <p className="eyebrow">Disagreements · {result.disagreements.length}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Human review queue</h2>
            <ul className="mt-4 divide-y divide-[var(--editorial-rule)]">
              {result.disagreements.map((row) => (
                <li key={`${row.employee_id}:${row.point_ref}`} className="py-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-graphite">{row.employee_id} · {row.point_ref}</p>
                  <p className="mt-1 text-sm"><strong>Expected:</strong> {row.expected ? `${flagLabel(row.expected.type)} · ${row.expected.severity}` : "No flag"}</p>
                  <p className="text-sm"><strong>Captured:</strong> {row.actual ? `${flagLabel(row.actual.type)} · ${row.actual.severity}` : "No flag"}</p>
                  <p className="mt-2 text-xs leading-relaxed text-graphite">{row.rationale}</p>
                </li>
              ))}
              {result.disagreements.length === 0 && <li className="py-4 text-sm text-graphite">No disagreements in this captured run.</li>}
            </ul>
          </section>

          <section className="rounded-xl border border-[var(--editorial-rule)] bg-[var(--editorial-card)] p-6">
            <p className="eyebrow">Interpretation limits</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">What this benchmark does not prove</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-graphite">
              <li>Version 1 contains {result.claims} claims across {result.employees} synthetic employees; it is useful for regression testing but too small for production fairness claims.</li>
              <li>Categories with zero labeled support are shown as “Not labeled” rather than receiving a misleading zero or perfect score.</li>
              <li>Captured outputs measure one stored run. A live repeated-run harness is still required for stochastic consistency and confidence intervals.</li>
              <li>Exact type agreement is {pct(result.exactTypeAccuracy)} and severity agreement is {pct(result.severityAccuracy)} among claims where both human and model raised a flag.</li>
            </ul>
            <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              Hackathon acceptance target: 100% audit completeness and citation resolution, no missed high-severity harmful claim, clean-case false-positive rate ≤10%, and macro F1 ≥80% after expanding to at least 50 labeled claims.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
