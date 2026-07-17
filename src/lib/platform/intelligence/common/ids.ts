/**
 * Shared id / period / empty-scope helpers (Stabilization A2).
 */

/** Opaque id: `${prefix}-${random}`. */
export function defaultCreateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** UTC calendar quarter label, e.g. `2026-Q3`. */
export function periodLabelQuarter(now = new Date()): string {
  return `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
}

/** ISO year-month label, e.g. `2026-07`. */
export function periodLabelIsoMonth(now = new Date()): string {
  return now.toISOString().slice(0, 7);
}

/** Locale month + year, e.g. `July 2026` (en-US). */
export function periodLabelLocaleMonthYear(now = new Date()): string {
  return now.toLocaleString("en-US", { month: "long", year: "numeric" });
}

/**
 * Board-governance style period: UTC long month + UTC year
 * (e.g. `July 2026`).
 */
export function periodLabelLocaleMonthUtcYear(now = new Date()): string {
  const month = now.toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  return `${month} ${now.getUTCFullYear()}`;
}

/** Minimal empty graph scope (structurally compatible with GraphScope). */
export function emptyGraphScope(): {
  organizationId: null;
  schoolId: null;
} {
  return { organizationId: null, schoolId: null };
}
