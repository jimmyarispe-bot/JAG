/**
 * Eastern wall-clock time, from a UTC instant and back again.
 *
 * WHY THIS EXISTS. Jimmy, repeatedly: "we operate on eastern standard time.
 * everyone else adjusts." Vercel runs in UTC, so every Date method that reads
 * LOCAL time - getHours, getDay, setHours, toTimeString - reads UTC there and
 * is four or five hours out depending on the month.
 *
 * That is not hypothetical, and it is not a small fault. On 1 October three
 * families were told the wrong hour for their interest meeting because a time
 * was rendered with toLocaleString() on a UTC server. appointment-text.ts
 * fixed the RENDERING. This fixes the ARITHMETIC: deciding which day it is,
 * and building "7:00am Eastern tomorrow" as an instant you can store.
 *
 * THERE IS A LIVE EXAMPLE OF THE SAME BUG STILL IN THE CODEBASE.
 * business-hours.ts decides whether a queued letter falls inside a school's
 * opening hours using at.getDay() and at.toTimeString(), and pushes anything
 * outside them to candidate.setHours(9, 0, 0, 0) - nine o'clock UTC, which is
 * five in the morning in Florida. It has never been noticed because all four
 * parent reminders are switched off, so almost nothing is ever queued. That is
 * reported, not fixed here: it is shared machinery that tour reminders also
 * use, and it is not this module's business to change it unasked. The chase
 * therefore computes its own send times through this file rather than relying
 * on that adjustment.
 *
 * NO LIBRARY. The project has eight runtime dependencies and none of them is a
 * timezone library. Intl carries the IANA database and is already trusted for
 * the times printed in front of families, so this uses the same source of
 * truth rather than adding a second one that could disagree with the first.
 *
 * DAYLIGHT SAVING IS ASKED ABOUT, NOT ASSUMED. Eastern is UTC-4 through the
 * school year and UTC-5 from the first Sunday in November, so a job pinned to
 * a fixed UTC hour quietly moves by an hour that weekend. Every function below
 * asks Intl what the offset actually is on the day in question.
 */

export const EASTERN_TIME_ZONE = "America/New_York";

export interface EasternParts {
  readonly year: number;
  readonly month: number; // 1-12
  readonly day: number; // 1-31
  readonly hour: number; // 0-23
  readonly minute: number;
  readonly second: number;
}

const FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: EASTERN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** What the clock on a wall in Orlando says at this instant. */
export function easternParts(at: Date): EasternParts {
  const found: Record<string, string> = {};
  for (const part of FORMATTER.formatToParts(at)) {
    if (part.type !== "literal") found[part.type] = part.value;
  }
  return {
    year: Number(found.year),
    month: Number(found.month),
    day: Number(found.day),
    /*
     * en-US with hour12:false renders midnight as "24" rather than "00" in
     * some runtimes. Both mean the same hour of the same day; normalising it
     * here keeps the arithmetic below honest. Found by reading the spec
     * rather than by being bitten, which is the cheaper of the two.
     */
    hour: Number(found.hour) % 24,
    minute: Number(found.minute),
    second: Number(found.second),
  };
}

/** Eastern calendar date as YYYY-MM-DD. The key the chase counts days in. */
export function easternDateKey(at: Date): string {
  const p = easternParts(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** The hour on that wall clock, 0-23. */
export function easternHour(at: Date): number {
  return easternParts(at).hour;
}

/** How far Eastern is from UTC at this instant, in minutes. -240 or -300. */
export function easternOffsetMinutes(at: Date): number {
  const p = easternParts(at);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const whole = Math.floor(at.getTime() / 1000) * 1000;
  return Math.round((asIfUtc - whole) / 60000);
}

/**
 * The instant at which an Eastern wall clock reads this date and time.
 *
 * Two passes, because the offset depends on the answer. The first guess
 * assumes the wall clock is UTC and is therefore four or five hours early; the
 * second asks what the offset really is near that moment and corrects. A third
 * pass can only matter for a wall time inside the one hour that daylight
 * saving deletes each March, which is 2:00-2:59am - and the chase never asks
 * for a time in it. Named here so that stays a decision rather than a lucky
 * omission.
 */
export function easternInstant(
  dateKey: string,
  hour: number,
  minute = 0
): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let instant = wall;
  for (let pass = 0; pass < 2; pass++) {
    instant = wall - easternOffsetMinutes(new Date(instant)) * 60000;
  }
  return new Date(instant);
}

/** The Eastern calendar date N days after this one, as a key. */
export function easternDateKeyPlusDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const moved = new Date(Date.UTC(year, month - 1, day + days));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${moved.getUTCFullYear()}-${pad(moved.getUTCMonth() + 1)}-${pad(
    moved.getUTCDate()
  )}`;
}

/**
 * Whole Eastern calendar days from one instant to another.
 *
 * CALENDAR DAYS, NOT ELAPSED HOURS, and the distinction is the whole reason
 * this function exists. Jimmy's clock is "the 2nd day at 11pm after receiving
 * the initial inquiry" - that is a date on a calendar, not 48 hours. An
 * inquiry at 11:55pm on Monday and one at 00:05am on Tuesday are a dozen
 * minutes apart and belong to different days, and the second family should not
 * be chased a day earlier than the first.
 */
export function easternDaysBetween(from: Date, to: Date): number {
  const a = easternParts(from);
  const b = easternParts(to);
  const dayA = Date.UTC(a.year, a.month - 1, a.day);
  const dayB = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((dayB - dayA) / 86400000);
}

/** 0 Sunday … 6 Saturday, by the Eastern calendar date. */
export function easternWeekday(at: Date): number {
  const p = easternParts(at);
  return new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
}

export function easternWeekdayOfKey(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Saturday or Sunday in Eastern. */
export function isEasternWeekend(at: Date): boolean {
  const d = easternWeekday(at);
  return d === 0 || d === 6;
}

/** The first Monday-to-Friday date key on or after this one. */
export function nextEasternWeekdayKey(dateKey: string): string {
  let key = dateKey;
  for (let i = 0; i < 7; i++) {
    const d = easternWeekdayOfKey(key);
    if (d !== 0 && d !== 6) return key;
    key = easternDateKeyPlusDays(key, 1);
  }
  return key;
}
