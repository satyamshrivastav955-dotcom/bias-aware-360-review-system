"use client";

import { AppHeader } from "@/components/app-header";
import { employees } from "@/data/employees";
import {
  appendExtraFeedback,
  clearSelfAssessment,
  loadExtraFeedback,
  loadSelfAssessment,
  removeExtraFeedbackEntry,
  saveSelfAssessment,
} from "@/lib/store";
import type { Feedback } from "@/lib/types";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type FeedbackKind = "manager" | "peer" | "self";

const KIND_LABELS: Record<FeedbackKind, string> = {
  manager: "Manager Feedback",
  peer: "Peer Feedback",
  self: "Self-Assessment",
};

const KIND_DESCRIPTIONS: Record<FeedbackKind, string> = {
  manager:
    "Direct manager evaluation — includes performance observations, incidents, and development notes.",
  peer: "Colleague / cross-functional review — lateral observations and collaboration quality.",
  self: "Employee's own written self-assessment for the review cycle. Replaces any previous self-assessment.",
};

function SubmitPageInner() {
  const searchParams = useSearchParams();
  const initialEmployee = (() => {
    const q = searchParams.get("employee");
    return employees.find((e) => e.employee_id === q)?.employee_id ?? employees[0].employee_id;
  })();

  const [selectedEmployee, setSelectedEmployee] = useState(initialEmployee);
  const [kind, setKind] = useState<FeedbackKind>("manager");
  const [reviewer, setReviewer] = useState("");
  const [text, setText] = useState("");
  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selfText, setSelfText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [extraEntries, setExtraEntries] = useState<Feedback[]>([]);
  const [currentSelf, setCurrentSelf] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    refresh();
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee]);

  function refresh() {
    setExtraEntries(loadExtraFeedback(selectedEmployee));
    setCurrentSelf(loadSelfAssessment(selectedEmployee));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (kind !== "self") {
      if (!reviewer.trim()) errs.reviewer = "Reviewer name is required.";
      if (!text.trim()) errs.text = "Feedback text is required.";
      if (!/^\d{4}-\d{2}$/.test(date)) errs.date = "Date must be in YYYY-MM format.";
    } else {
      if (!selfText.trim()) errs.selfText = "Self-assessment text is required.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    if (kind === "self") {
      saveSelfAssessment(selectedEmployee, selfText.trim());
    } else {
      const entry = {
        id: `manual_${kind}_${Date.now()}`,
        reviewer: reviewer.trim(),
        text: text.trim(),
        date,
        kind,
      } as Feedback & { kind: string };
      appendExtraFeedback(selectedEmployee, entry as Feedback);
    }

    setReviewer("");
    setText("");
    setSelfText("");
    setErrors({});
    setSubmitted(true);
    refresh();
    setTimeout(() => setSubmitted(false), 3500);
  }

  function handleDelete(entryId: string) {
    removeExtraFeedbackEntry(selectedEmployee, entryId);
    refresh();
  }

  function handleClearSelf() {
    clearSelfAssessment(selectedEmployee);
    refresh();
  }

  const emp = employees.find((e) => e.employee_id === selectedEmployee)!;

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="mx-auto w-[min(860px,100%)] px-6 py-12 pb-32">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Submit Feedback
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manually add manager feedback, peer reviews, or self-assessments.
            Submitted entries are included the next time an AI Review Draft is
            generated for this employee.
          </p>
        </div>

        {/* Employee selector */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#20272e] p-6 shadow-xs mb-6">
          <label
            htmlFor="employee-select"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"
          >
            Employee
          </label>
          <select
            id="employee-select"
            value={selectedEmployee}
            onChange={(e) => {
              setSelectedEmployee(e.target.value);
              setSubmitted(false);
              setErrors({});
            }}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {employees.map((e) => (
              <option key={e.employee_id} value={e.employee_id}>
                {e.name} — {e.role}
              </option>
            ))}
          </select>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
            ID: {selectedEmployee}
          </p>
        </section>

        {/* Feedback type tabs */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#20272e] p-6 shadow-xs mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Feedback Type
          </p>
          <div className="flex gap-2 flex-wrap">
            {(["manager", "peer", "self"] as FeedbackKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  setErrors({});
                }}
                className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
                  kind === k
                    ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400 bg-white dark:bg-slate-800"
                }`}
              >
                {KIND_LABELS[k]}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {KIND_DESCRIPTIONS[kind]}
          </p>
        </section>

        {/* Form */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#20272e] p-6 shadow-xs mb-6">
          <form onSubmit={handleSubmit} noValidate>
            {kind !== "self" ? (
              <div className="space-y-5">
                {/* Reviewer name */}
                <div>
                  <label
                    htmlFor="reviewer-name"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {kind === "manager" ? "Manager Name" : "Reviewer Name"}
                  </label>
                  <input
                    id="reviewer-name"
                    type="text"
                    placeholder={
                      kind === "manager"
                        ? "e.g. Vikram Rao (Manager A)"
                        : "e.g. Ankit Verma (Peer B)"
                    }
                    value={reviewer}
                    onChange={(e) => setReviewer(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.reviewer
                        ? "border-rose-400"
                        : "border-slate-200 dark:border-slate-600"
                    }`}
                  />
                  {errors.reviewer && (
                    <p className="mt-1 text-xs text-rose-600">{errors.reviewer}</p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label
                    htmlFor="feedback-date"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Date (YYYY-MM)
                  </label>
                  <input
                    id="feedback-date"
                    type="month"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.date
                        ? "border-rose-400"
                        : "border-slate-200 dark:border-slate-600"
                    }`}
                  />
                  {errors.date && (
                    <p className="mt-1 text-xs text-rose-600">{errors.date}</p>
                  )}
                </div>

                {/* Feedback text */}
                <div>
                  <label
                    htmlFor="feedback-text"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Feedback
                  </label>
                  <textarea
                    id="feedback-text"
                    rows={6}
                    placeholder={
                      kind === "manager"
                        ? "Describe the employee's performance with specific examples, incidents, or observations..."
                        : "Describe your experience working with this person, with specific examples..."
                    }
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 shadow-xs resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed ${
                      errors.text
                        ? "border-rose-400"
                        : "border-slate-200 dark:border-slate-600"
                    }`}
                  />
                  {errors.text && (
                    <p className="mt-1 text-xs text-rose-600">{errors.text}</p>
                  )}
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Tip: cite specific incidents, dates, or PRs to reduce
                    &ldquo;unsupported claim&rdquo; flags in the AI audit.
                  </p>
                </div>
              </div>
            ) : (
              /* Self-assessment */
              <div>
                <label
                  htmlFor="self-text"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Self-Assessment
                </label>
                {currentSelf && (
                  <div className="mb-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-3 text-xs text-amber-900 dark:text-amber-300">
                    <p className="font-semibold">Existing self-assessment on file</p>
                    <p className="mt-1 leading-relaxed line-clamp-3">{currentSelf}</p>
                    <p className="mt-2 text-amber-700 dark:text-amber-400">
                      Submitting will replace it.
                    </p>
                  </div>
                )}
                <textarea
                  id="self-text"
                  rows={8}
                  placeholder="Describe your key contributions, achievements, and areas where you want to grow this review cycle..."
                  value={selfText}
                  onChange={(e) => setSelfText(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 shadow-xs resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed ${
                    errors.selfText
                      ? "border-rose-400"
                      : "border-slate-200 dark:border-slate-600"
                  }`}
                />
                {errors.selfText && (
                  <p className="mt-1 text-xs text-rose-600">{errors.selfText}</p>
                )}
              </div>
            )}

            {/* Submit row */}
            <div className="mt-6 flex items-center gap-4">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save {KIND_LABELS[kind]}
              </button>

              {submitted && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Saved — included in next AI draft
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Submitted entries panel */}
        {hydrated && (extraEntries.length > 0 || currentSelf) && (
          <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#20272e] p-6 shadow-xs mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
              Manually Submitted for {emp.name}
            </h2>

            {/* Self-assessment on file */}
            {currentSelf && (
              <div className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Self-Assessment (active)
                  </span>
                  <button
                    type="button"
                    onClick={handleClearSelf}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 dark:hover:text-rose-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {currentSelf}
                </p>
              </div>
            )}

            {/* Extra feedback entries */}
            {extraEntries.length > 0 && (
              <ul className="space-y-3">
                {extraEntries.map((entry) => {
                  const kindEntry =
                    (entry as Feedback & { kind?: string }).kind ?? "manager";
                  return (
                    <li
                      key={entry.id}
                      className="rounded-lg border border-slate-200 dark:border-slate-600 p-4"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                              kindEntry === "manager"
                                ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                                : "bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700"
                            }`}
                          >
                            {kindEntry === "manager" ? "Manager" : "Peer"}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {entry.reviewer}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {entry.date}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 dark:hover:text-rose-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {entry.text}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* CTA */}
        <div className="rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 p-5">
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">
            Ready to generate the review?
          </p>
          <p className="mt-1 text-xs text-blue-800 dark:text-blue-400 leading-relaxed">
            All submitted entries above will be included automatically. Navigate
            to the employee&apos;s review page and click &ldquo;Generate AI Review
            Draft.&rdquo;
          </p>
          <Link
            href={`/review/${selectedEmployee}`}
            className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Open {emp.name}&apos;s Review →
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="app-shell"><AppHeader /></div>}>
      <SubmitPageInner />
    </Suspense>
  );
}
