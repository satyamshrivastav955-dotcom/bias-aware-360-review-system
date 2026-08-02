import type { AuditEntry, Report } from "./types";

// known-limitation: no GET endpoint exists for a report or audit history, so the
// browser holds the readable copy. The webhook still gets every write —
// the backend remains the authoritative record.
const key = (kind: string, id: string) => `br:${kind}:${id}`;

function read<T>(k: string): T | null {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    // Quota or private mode. The session still works, it just won't survive
    // a refresh — not worth failing the flow over.
  }
}

export const loadReport = (employeeId: string) =>
  read<Report>(key("report", employeeId));
export const saveReport = (employeeId: string, r: Report) =>
  write(key("report", employeeId), r);

export const loadOriginal = (employeeId: string) =>
  read<Report>(key("orig", employeeId));
export const saveOriginal = (employeeId: string, r: Report) =>
  write(key("orig", employeeId), r);

export const loadAudit = (employeeId: string) =>
  read<AuditEntry[]>(key("audit", employeeId)) ?? [];

export function appendAudit(employeeId: string, entry: AuditEntry) {
  write(key("audit", employeeId), [...loadAudit(employeeId), entry]);
}

export function clearEmployee(employeeId: string) {
  for (const k of ["report", "orig", "audit"]) {
    try {
      localStorage.removeItem(key(k, employeeId));
    } catch {}
  }
}
