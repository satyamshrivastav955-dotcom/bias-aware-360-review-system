// How long a generated review is kept before it should be erased. Two cycles:
// long enough that this year's review can be read against last year's, short
// enough that a performance judgment does not follow someone indefinitely.
// A number stated in one place and shown in the interface, rather than a policy
// that exists only in a document nobody reads.
export const RETENTION_MONTHS = 24;

export type RetentionStatus = {
  expiresOn: string; // YYYY-MM-DD
  daysRemaining: number; // negative once the window has closed
  expired: boolean;
};

const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

// Month arithmetic, not 730 days: a retention window expressed in months should
// land on the same day of the month. Clamped to the last valid day so a report
// created on 29 February expires on 28 February, not silently on 1 March.
export function retentionStatus(
  createdAt: string,
  now: Date = new Date(),
): RetentionStatus | null {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;

  const year = created.getUTCFullYear();
  const month = created.getUTCMonth() + RETENTION_MONTHS;
  const lastOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const expiry = Date.UTC(
    year,
    month,
    Math.min(created.getUTCDate(), lastOfMonth),
  );

  // Compared date to date, not instant to instant, so a report does not read as
  // expiring "in 0 days" for the whole of its final day.
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const daysRemaining = Math.round((expiry - today) / DAY);

  return {
    expiresOn: iso(new Date(expiry)),
    daysRemaining,
    expired: daysRemaining <= 0,
  };
}
