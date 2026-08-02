import type { Consent } from "@/lib/types";

// Presentational only — consent is recorded upstream at collection time and
// this system only reads it. Three states, each stating a fact rather than a
// status word, so an absent or withheld consent stays visible in the UI.
// Colours mirror SEVERITY_BADGE in components/claim-row.tsx, with dark: pairs.
const BADGE = {
  amber:
    "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300",
  rose: "bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300",
  emerald:
    "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300",
} as const;

const BASE = "rounded border px-2 py-0.5 font-mono text-xs";

export function ConsentBadge({ consent }: { consent: Consent | undefined }) {
  if (!consent)
    return (
      <span className={`${BASE} ${BADGE.amber}`}>Consent not recorded</span>
    );

  if (!consent.granted)
    return (
      <span className={`${BASE} ${BADGE.rose}`}>
        Consent withheld — not cleared for review
      </span>
    );

  return (
    <span className={`${BASE} ${BADGE.emerald}`}>
      Consent recorded {consent.granted_at}, {consent.basis.replace(/_/g, " ")}
    </span>
  );
}
