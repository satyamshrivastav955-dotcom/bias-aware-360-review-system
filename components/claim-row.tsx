"use client";

import { useEffect, useRef, useState } from "react";
import type { Claim, Flag, FlagType, Severity, Source } from "@/lib/types";
import { flagLabel } from "@/lib/types";
import { FLAG_TYPES } from "@/lib/schemas";
import type { ReauditSignal } from "@/lib/reaudit";

const SEVERITY_BADGE: Record<Severity, string> = {
  high: "bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300",
  medium: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300",
  low: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300",
};

const SEVERITIES: Severity[] = ["high", "medium", "low"];

export default function ClaimRow({
  claim,
  sources,
  canEdit,
  edited,
  reaudit,
  acknowledged,
  onChange,
  onDelete,
  onFlagChange,
  onCite,
}: {
  claim: Claim;
  sources: Source[];
  canEdit: boolean;
  edited: boolean;
  reaudit: ReauditSignal[] | null;
  acknowledged: boolean;
  onChange: (text: string) => void;
  onDelete?: () => void;
  onFlagChange?: (flag: Flag | null) => void;
  onCite: (s: Source) => void;
}) {
  // Auto-open edit mode for freshly-added empty claims.
  const [editing, setEditing] = useState(claim.text === "");
  const [editingFlag, setEditingFlag] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const flagRef = useRef<HTMLTextAreaElement>(null);
  const flag = claim.flag;

  // Only an amended claim is re-checked. The model already judged the original
  // wording; this runs on what the reviewer replaced it with.
  const hits = reaudit?.filter((s) => s.raised) ?? [];
  // Personality and appearance wording is the serious tell; an absolute is a
  // middling one; a missing anchor alone is the mildest.
  const worst: Severity | null = hits.some((s) => s.id === "personality" || s.id === "appearance")
    ? "high"
    : hits.some((s) => s.id === "absolute")
      ? "medium"
      : hits.length
        ? "low"
        : null;

  useEffect(() => {
    if (!editing || !ref.current) return;
    const el = ref.current;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    el.style.height = `${el.scrollHeight}px`;
  }, [editing]);

  useEffect(() => {
    if (!editingFlag || !flagRef.current) return;
    flagRef.current.focus();
  }, [editingFlag]);

  useEffect(() => {
    if (!canEdit) { setEditing(false); setEditingFlag(false); }
  }, [canEdit]);

  function handleFlagField(field: Partial<Flag>) {
    if (!flag || !onFlagChange) return;
    onFlagChange({ ...flag, ...field });
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c232a] p-4 transition-all hover:border-slate-300 dark:hover:border-slate-600">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {editing ? (
            <textarea
              ref={ref}
              value={claim.text}
              onChange={(e) => {
                onChange(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onBlur={() => setEditing(false)}
              aria-label="Amend this claim"
              className="w-full resize-none rounded-md border border-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 p-3 text-sm leading-relaxed text-slate-900 focus:outline-none"
            />
          ) : (
            <div className="group relative">
              <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {claim.text || <span className="italic text-slate-400">Empty — click Edit Claim to add text</span>}
              </p>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="no-print mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                >
                  Edit Claim
                </button>
              )}
            </div>
          )}

          {/* Sources */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-400">Sources:</span>
            {sources.map((s) => {
              const missing = s.kind === "unresolved";
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onCite(s)}
                  title={missing ? "No matching source on file" : "View source details"}
                  className={`rounded px-2 py-0.5 font-mono text-xs font-medium transition-colors ${
                    missing
                      ? "border border-dashed border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      : "border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {missing ? "Unresolved: " : ""}
                  {s.id}
                </button>
              );
            })}
            {sources.length === 0 && (
              <span className="font-mono text-xs font-medium text-rose-600">No Citation Provided</span>
            )}
          </div>

          {/* Print-only source list */}
          {sources.length > 0 && (
            <dl className="mt-2 hidden print:block">
              {sources.map((s) => (
                <div key={s.id} className="mt-1 flex gap-2 text-[10px] leading-snug">
                  <dt className="shrink-0 font-mono text-slate-500">{s.id}</dt>
                  <dd className="text-slate-600">
                    {s.kind === "unresolved" ? "No matching source on file." : `"${s.text}"${s.reviewer ? ` — ${s.reviewer}` : ""}`}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Delete button */}
        {canEdit && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Remove this claim"
            className="no-print shrink-0 rounded-md p-1 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 transition-colors"
            title="Remove claim"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Flag Panel ───────────────────────────────────────── */}
      {flag ? (
        <div className={`mt-3 rounded-md border p-3 ${SEVERITY_BADGE[flag.severity]}`}>
          {/* Flag header row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {editingFlag ? (
              /* Severity + Type dropdowns */
              <div className="flex flex-wrap gap-2">
                <select
                  value={flag.severity}
                  onChange={(e) => handleFlagField({ severity: e.target.value as Severity })}
                  className="rounded border border-current/30 bg-white/70 dark:bg-black/20 px-2 py-0.5 font-mono text-xs font-semibold focus:outline-none"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>{s} severity</option>
                  ))}
                </select>
                <select
                  value={flag.type}
                  onChange={(e) => handleFlagField({ type: e.target.value as FlagType })}
                  className="rounded border border-current/30 bg-white/70 dark:bg-black/20 px-2 py-0.5 font-mono text-xs font-semibold focus:outline-none"
                >
                  {FLAG_TYPES.map((t) => (
                    <option key={t} value={t}>{flagLabel(t)}</option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                Flag: {flagLabel(flag.type)} ({flag.severity} severity)
              </span>
            )}

            {/* Flag action buttons */}
            {canEdit && onFlagChange && (
              <div className="no-print flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingFlag((v) => !v)}
                  className="font-mono text-[10px] uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity"
                >
                  {editingFlag ? "Done" : "Edit flag"}
                </button>
                <span className="opacity-30">·</span>
                <button
                  type="button"
                  onClick={() => onFlagChange(null)}
                  className="font-mono text-[10px] uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity"
                  title="Remove this flag from the claim"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Flag reasoning — editable */}
          {editingFlag ? (
            <textarea
              ref={flagRef}
              value={flag.reasoning}
              rows={3}
              onChange={(e) => handleFlagField({ reasoning: e.target.value })}
              className="mt-2 w-full resize-none rounded border border-current/30 bg-white/70 dark:bg-black/20 p-2 text-xs leading-relaxed focus:outline-none"
              placeholder="Reasoning for this flag..."
            />
          ) : (
            <p className="mt-1 text-xs leading-relaxed">{flag.reasoning}</p>
          )}

          {edited && (
            <p className="mt-2 border-t border-current/20 pt-1 font-mono text-[10px] uppercase tracking-wider opacity-80">
              Claim amended — original flag remains until explicitly reviewed
            </p>
          )}
          {acknowledged && (
            <p className="mt-2 border-t border-current/20 pt-1 font-mono text-[10px] uppercase tracking-wider opacity-80">
              {edited ? "Amendment and original flag acknowledged" : "Acknowledged without amendment"}
            </p>
          )}
        </div>
      ) : (
        /* No flag — offer to add one manually */
        canEdit && onFlagChange && (
          <div className="no-print mt-3">
            <button
              type="button"
              onClick={() =>
                onFlagChange({ type: "unsupported_claim", severity: "low", reasoning: "" })
              }
              className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              + Add flag manually
            </button>
          </div>
        )
      )}

      {/* ── Re-audit of the amendment ────────────────────────── */}
      {reaudit && (
        <div
          className={`mt-3 rounded-md border p-3 ${
            worst ? SEVERITY_BADGE[worst] : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">
              Re-check of amendment{worst ? ` (${worst} severity)` : " — clear"}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">
              Deterministic · no AI
            </span>
          </div>
          {hits.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {hits.map((s) => (
                <li key={s.id} className="text-xs leading-relaxed">
                  <span className="font-semibold">{s.label}:</span> {s.detail}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs leading-relaxed">
              The amended wording passes every rule this check applies. It does not clear
              the flag above — only a reviewer can do that.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
