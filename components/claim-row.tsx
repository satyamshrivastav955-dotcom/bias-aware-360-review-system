"use client";

import { useEffect, useRef, useState } from "react";
import type { Claim, Source } from "@/lib/types";
import { flagLabel } from "@/lib/types";

const WASH = {
  high: "wash wash-high",
  medium: "wash wash-medium",
  low: "wash wash-low",
} as const;

const SEVERITY_INK = {
  high: "text-pen",
  medium: "text-[#8a6a12]",
  low: "text-graphite",
} as const;

const SEVERITY_BORDER = {
  high: "border-pen",
  medium: "border-amber",
  low: "border-rule",
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
    <div className="claim-grid py-6">
      <div className="min-w-0">
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
            className="w-full resize-none border-l-2 border-ink bg-white/60 py-1 pl-3 text-[17px] leading-relaxed focus:outline-none"
          />
        ) : (
          <p className="group text-[17px] leading-relaxed">
            <span className={flag ? WASH[flag.severity] : ""}>{claim.text}</span>
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="no-print ml-2 align-baseline font-mono text-[10px] uppercase tracking-[0.12em] text-graphite underline decoration-rule underline-offset-4 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-ink hover:decoration-ink"
              >
                Amend
              </button>
            )}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {sources.map((s) => {
            const missing = s.kind === "unresolved";
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onCite(s)}
                title={missing ? "No matching source on file" : "View the source"}
                className={`px-2 py-1 font-mono text-[11px] transition-colors ${
                  missing
                    ? "border border-dashed border-pen text-pen hover:bg-pen/10"
                    : "border border-rule text-graphite hover:border-ink hover:text-ink"
                }`}
              >
                {missing ? "? " : ""}
                {s.id}
              </button>
            );
          })}
          {sources.length === 0 && (
            <span className="font-mono text-[11px] text-pen">no citation</span>
          )}
        </div>
      </div>

      {flag && (
        <aside
          className={`margin-note border-l-2 pl-4 ${SEVERITY_BORDER[flag.severity]}`}
        >
          <p
            className={`font-mono text-[11px] uppercase tracking-[0.12em] ${SEVERITY_INK[flag.severity]}`}
          >
            {flagLabel(flag.type)} &middot; {flag.severity}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-graphite">
            {flag.reasoning}
          </p>
          {edited && (
            <p className="mt-3 border-t border-rule pt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-graphite">
              Amended after this audit &mdash; not re-checked
            </p>
          )}
          {acknowledged && !edited && (
            <p className="mt-3 border-t border-rule pt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-graphite">
              Acknowledged as written
            </p>
          )}
        </aside>
      )}
    </div>
  );
}
