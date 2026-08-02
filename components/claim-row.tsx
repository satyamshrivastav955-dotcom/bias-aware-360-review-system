"use client";

import { useEffect, useRef, useState } from "react";
import type { Claim, Source } from "@/lib/types";
import { flagLabel } from "@/lib/types";

const SEVERITY_BADGE = {
  high: "bg-rose-50 border-rose-200 text-rose-800",
  medium: "bg-amber-50 border-amber-200 text-amber-800",
  low: "bg-slate-50 border-slate-200 text-slate-700",
} as const;

export default function ClaimRow({
  claim,
  sources,
  canEdit,
  edited,
  acknowledged,
  onChange,
  onCite,
}: {
  claim: Claim;
  sources: Source[];
  canEdit: boolean;
  edited: boolean;
  acknowledged: boolean;
  onChange: (text: string) => void;
  onCite: (s: Source) => void;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const flag = claim.flag;

  useEffect(() => {
    if (!editing || !ref.current) return;
    const el = ref.current;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    el.style.height = `${el.scrollHeight}px`;
  }, [editing]);

  useEffect(() => {
    if (!canEdit) setEditing(false);
  }, [canEdit]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-slate-300">
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
              className="w-full resize-none rounded-md border border-blue-500 bg-slate-50 p-3 text-sm leading-relaxed text-slate-900 focus:outline-none"
            />
          ) : (
            <div className="group relative">
              <p className="text-sm leading-relaxed text-slate-800">
                {claim.text}
              </p>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="no-print mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Edit Claim
                </button>
              )}
            </div>
          )}

          {/* Sources */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
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
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
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
        </div>
      </div>

      {/* Flag Panel if present */}
      {flag && (
        <div className={`mt-3 rounded-md border p-3 ${SEVERITY_BADGE[flag.severity]}`}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">
              Flag: {flagLabel(flag.type)} ({flag.severity} severity)
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed">
            {flag.reasoning}
          </p>
          {edited && (
            <p className="mt-2 border-t border-current/20 pt-1 font-mono text-[10px] uppercase tracking-wider opacity-80">
              Claim amended by reviewer — flag invalidated
            </p>
          )}
          {acknowledged && !edited && (
            <p className="mt-2 border-t border-current/20 pt-1 font-mono text-[10px] uppercase tracking-wider opacity-80">
              Acknowledged as written
            </p>
          )}
        </div>
      )}
    </div>
  );
}
