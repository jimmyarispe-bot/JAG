/** Period helpers for daily KPI snapshots. */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidSnapshotDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Today in UTC as YYYY-MM-DD. */
export function todaySnapshotDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function assertSnapshotDate(value: string): string {
  if (!isValidSnapshotDate(value)) {
    throw new Error(`Invalid snapshot date: ${value}`);
  }
  return value;
}

/** Inclusive list of YYYY-MM-DD dates from fromDate through toDate. */
export function enumerateSnapshotDates(fromDate: string, toDate: string): string[] {
  const from = assertSnapshotDate(fromDate);
  const to = assertSnapshotDate(toDate);
  if (from > to) {
    throw new Error(`fromDate (${from}) must be <= toDate (${to})`);
  }

  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    dates.push(cursor);
    const [y, m, d] = cursor.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    cursor = next.toISOString().slice(0, 10);
  }
  return dates;
}

/**
 * Stable period key for duplicate detection within a calendar day.
 * Same organization/region/campus/program/metric/date → same period.
 */
export function buildSnapshotPeriodKey(input: {
  organizationId?: string | null;
  regionId?: string | null;
  schoolId?: string | null;
  campusId?: string | null;
  program?: string | null;
  metricId: string;
  snapshotDate: string;
}): string {
  return [
    input.organizationId ?? "",
    input.regionId ?? "",
    input.schoolId ?? "",
    input.campusId ?? "",
    input.program ?? "",
    input.metricId,
    input.snapshotDate,
  ].join("|");
}
