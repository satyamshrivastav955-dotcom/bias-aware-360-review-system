"use client";

import { useEffect } from "react";
import { KIND_LABEL } from "@/lib/sources";
import type { Source } from "@/lib/types";

export default function SourceDrawer({
  source,
  onClose,
}: {
  source: Source | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!source) return null;
  const missing = source.kind === "unresolved";

  return (
    <div className="no-print fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close source"
        onClick={onClose}
        className="absolute inset-0 bg-ink/20"
      />
      <aside
        role="dialog"
        aria-label="Source detail"
        className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-sheet shadow-2xl sm:w-[26rem]"
      >
        <header className="flex items-start justify-between border-b border-rule p-6">
          <div>
            <p
              className={`font-mono text-[11px] uppercase tracking-[0.14em] ${missing ? "text-pen" : "text-graphite"}`}
            >
              {KIND_LABEL[source.kind]}
            </p>
            <p className="mt-2 font-mono text-sm">{source.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite hover:text-ink"
          >
            Close
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {(source.reviewer || source.date) && (
            <p className="mb-5 font-mono text-[11px] text-graphite">
              {source.reviewer}
              {source.reviewer && source.date ? " · " : ""}
              {source.date}
            </p>
          )}
          <p
            className={`text-[16px] leading-relaxed whitespace-pre-line ${missing ? "text-pen" : ""}`}
          >
            {source.text}
          </p>
        </div>

        <footer className="border-t border-rule p-6">
          <p className="font-mono text-[10px] leading-relaxed uppercase tracking-[0.12em] text-graphite">
            {missing
              ? "Nothing on file under this identifier. Amend or remove the claim."
              : "Verbatim from the employee feedback file. Not generated."}
          </p>
        </footer>
      </aside>
    </div>
  );
}
