"use client";

import { useEffect, useState } from "react";
import { loadReviewer, saveReviewer } from "@/lib/store";
import { REVIEWER } from "@/lib/types";

// Attribution, not authentication. There is no login and nothing verifies this
// name; the reviewer states who they are so the audit trail records something
// more useful than a shared "Manager". The UI says so plainly rather than
// implying an identity was checked.
//
// Reads on mount rather than during render: the server has no localStorage, so
// initialising state from it would hydrate mismatched.
export function useReviewer() {
  const [name, setName] = useState<string>(REVIEWER);

  useEffect(() => {
    const sync = () => setName(loadReviewer() ?? REVIEWER);
    sync();
    window.addEventListener("reviewer-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("reviewer-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return name;
}

export function ReviewerIdentity() {
  const name = useReviewer();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function commit() {
    const trimmed = draft.trim();
    // An empty name would attribute the trail to nobody. Falling back to the
    // shared default is honest; a blank actor is not.
    saveReviewer(trimmed || REVIEWER);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        aria-label="Your name, recorded on every decision you make"
        placeholder="Your name"
        className="w-36 rounded border border-slate-300 bg-white px-2 py-1 font-mono text-xs text-slate-900 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(name === REVIEWER ? "" : name);
        setEditing(true);
      }}
      title="Recorded on every decision you make. Not verified — this is attribution, not a login."
      className="rounded px-2 py-1 font-mono text-xs text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
    >
      {name}
    </button>
  );
}
