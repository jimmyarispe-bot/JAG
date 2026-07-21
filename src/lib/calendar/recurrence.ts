/**
 * Lightweight recurrence expander for AcademyOS calendars.
 * Supports: daily | weekly | monthly tokens and basic RRULE
 * (FREQ=DAILY|WEEKLY|MONTHLY;INTERVAL;COUNT;UNTIL;BYDAY).
 */

export interface OccurrenceWindow {
  startsAt: Date;
  endsAt: Date;
}

const DAY_CODES: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

function parseRrule(rrule: string): {
  freq: "DAILY" | "WEEKLY" | "MONTHLY";
  interval: number;
  count: number | null;
  until: Date | null;
  byDay: number[] | null;
} {
  const parts = rrule
    .replace(/^RRULE:/i, "")
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
  const map = new Map(
    parts.map((p) => {
      const [k, v] = p.split("=");
      return [k.toUpperCase(), v] as const;
    })
  );

  const freqRaw = (map.get("FREQ") ?? "WEEKLY").toUpperCase();
  const freq =
    freqRaw === "DAILY" || freqRaw === "MONTHLY" ? freqRaw : ("WEEKLY" as const);
  const interval = Math.max(1, Number(map.get("INTERVAL") ?? 1) || 1);
  const count = map.has("COUNT") ? Math.max(1, Number(map.get("COUNT")) || 1) : null;
  const until = map.has("UNTIL") ? parseUntil(map.get("UNTIL")!) : null;
  const byDay = map.has("BYDAY")
    ? map
        .get("BYDAY")!
        .split(",")
        .map((d) => DAY_CODES[d.trim().toUpperCase().slice(-2)])
        .filter((n) => n != null)
    : null;

  return { freq, interval, count, until, byDay };
}

function parseUntil(value: string): Date | null {
  // Supports YYYYMMDD or ISO
  if (/^\d{8}$/.test(value)) {
    const y = Number(value.slice(0, 4));
    const m = Number(value.slice(4, 6)) - 1;
    const d = Number(value.slice(6, 8));
    return new Date(Date.UTC(y, m, d, 23, 59, 59));
  }
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function normalizeRule(rule: string | null | undefined): string | null {
  if (!rule?.trim()) return null;
  const trimmed = rule.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "daily") return "FREQ=DAILY;INTERVAL=1";
  if (lower === "weekly") return "FREQ=WEEKLY;INTERVAL=1";
  if (lower === "monthly") return "FREQ=MONTHLY;INTERVAL=1";
  return trimmed;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/**
 * Expand a recurring event into occurrence windows within [rangeStart, rangeEnd].
 * Non-recurring events return a single occurrence if they overlap the range.
 */
export function expandOccurrences(input: {
  startsAt: string | Date;
  endsAt: string | Date;
  recurrenceRule?: string | null;
  rangeStart: string | Date;
  rangeEnd: string | Date;
  maxOccurrences?: number;
  /** Exception original starts (ISO) that should be skipped */
  cancelledOriginalStarts?: string[];
}): OccurrenceWindow[] {
  const start = new Date(input.startsAt);
  const end = new Date(input.endsAt);
  const rangeStart = new Date(input.rangeStart);
  const rangeEnd = new Date(input.rangeEnd);
  const durationMs = end.getTime() - start.getTime();
  if (durationMs <= 0 || Number.isNaN(start.getTime())) return [];

  const rule = normalizeRule(input.recurrenceRule);
  const cancelled = new Set(
    (input.cancelledOriginalStarts ?? []).map((s) => new Date(s).toISOString())
  );
  const max = input.maxOccurrences ?? 366;

  if (!rule) {
    if (end < rangeStart || start > rangeEnd) return [];
    if (cancelled.has(start.toISOString())) return [];
    return [{ startsAt: start, endsAt: end }];
  }

  const parsed = parseRrule(rule);
  const results: OccurrenceWindow[] = [];
  let cursor = new Date(start.getTime());
  let generated = 0;
  let guard = 0;

  while (generated < max && guard < 2000) {
    guard += 1;
    if (parsed.until && cursor > parsed.until) break;
    if (parsed.count != null && generated >= parsed.count) break;

    const occEnd = new Date(cursor.getTime() + durationMs);
    const dayOk =
      !parsed.byDay?.length || parsed.byDay.includes(cursor.getUTCDay());

    if (dayOk && occEnd >= rangeStart && cursor <= rangeEnd) {
      if (!cancelled.has(cursor.toISOString())) {
        results.push({ startsAt: new Date(cursor), endsAt: occEnd });
      }
    }

    generated += 1;

    if (parsed.freq === "DAILY") {
      cursor = addDays(cursor, parsed.interval);
    } else if (parsed.freq === "WEEKLY") {
      if (parsed.byDay?.length) {
        // Advance day-by-day within week pattern
        let next = addDays(cursor, 1);
        let hops = 0;
        while (hops < 14) {
          hops += 1;
          const weeksFromStart = Math.floor(
            (next.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)
          );
          if (weeksFromStart % parsed.interval === 0 && parsed.byDay.includes(next.getUTCDay())) {
            cursor = next;
            break;
          }
          next = addDays(next, 1);
        }
        if (hops >= 14) cursor = addDays(cursor, 7 * parsed.interval);
      } else {
        cursor = addDays(cursor, 7 * parsed.interval);
      }
    } else {
      cursor = addMonths(cursor, parsed.interval);
    }

    if (cursor > rangeEnd && (!parsed.count || generated >= (parsed.count ?? 0))) {
      if (cursor > addDays(rangeEnd, 31)) break;
    }
  }

  return results;
}

export function timesOverlap(
  aStart: Date | string,
  aEnd: Date | string,
  bStart: Date | string,
  bEnd: Date | string
): boolean {
  const as = new Date(aStart).getTime();
  const ae = new Date(aEnd).getTime();
  const bs = new Date(bStart).getTime();
  const be = new Date(bEnd).getTime();
  return as < be && bs < ae;
}
