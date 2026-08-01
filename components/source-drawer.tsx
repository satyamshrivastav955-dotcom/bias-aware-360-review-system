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
    <div className="no-print fixed inset-0 z-50 overflow-hidden">
      <button
        type="button"
        aria-label="Close source drawer"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />
      <aside
        role="dialog"
        aria-label="Source Details"
        className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 p-6">
          <div>
            <span
              className={`rounded px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider ${
                missing ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
              }`}
            >
              {KIND_LABEL[source.kind]}
            </span>
            <h3 className="mt-2 font-mono text-sm font-bold text-slate-900">{source.id}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            Close
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {(source.reviewer || source.date) && (
            <div className="mb-4 rounded-md bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600">
              {source.reviewer && <p><span className="font-semibold text-slate-700">Author:</span> {source.reviewer}</p>}
              {source.date && <p><span className="font-semibold text-slate-700">Date:</span> {source.date}</p>}
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Original Source Excerpt</h4>
            <p className={`text-sm leading-relaxed whitespace-pre-line ${missing ? "text-rose-700" : "text-slate-800"}`}>
              {source.text}
            </p>
          </div>
        </div>

        <footer className="border-t border-slate-200 bg-slate-50 p-6 text-xs text-slate-500">
          {missing
            ? "No matching source record found on file. Amend or remove the claim."
            : "Verbatim record extracted directly from official employee feedback files."}
        </footer>
      </aside>
    </div>
  );
}
