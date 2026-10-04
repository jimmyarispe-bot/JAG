/**
 * An appointment time a parent can read, in Eastern.
 *
 * WHY IT IS ITS OWN FILE. It began inside actions.ts, which carries
 * "use server" - and every export of a server-action file must be an async
 * function. `npx tsc --noEmit` is perfectly happy with a synchronous export
 * there; `npm run build` refuses it:
 *
 *     Server Actions must be async functions.
 *     ./src/lib/admissions/actions.ts:40:17
 *
 * The second time in one day that the build caught what the typecheck could
 * not. A pure helper does not belong in a server-action file anyway.
 *
 * WHAT IT REPLACES. `new Date(iso).toLocaleString()`, which produced
 * "9/24/2026, 1:00:00 PM" - seconds on a school appointment, rendered in
 * whatever timezone the server happened to be in rather than the one the
 * school is in. Jimmy's rule stands: "we operate on eastern standard time.
 * everyone else adjusts."
 *
 * Built from parts rather than one format string because no single locale
 * gives the shape below - en-US puts a comma in a different place, en-GB uses
 * a 24-hour clock.
 *
 * THE SHAPE CHANGED ON 4 OCTOBER 2026, at Jimmy's request, reading a draft of
 * the interest-meeting confirmation:
 *
 *     "Can we change this to day, month, date, year @ time am/pm?"
 *
 *   was   Wednesday, 7 October 2026 at 3:15 PM
 *   now   Wednesday, October 7, 2026 @ 3:15 PM
 *
 * He is correcting an inconsistency, not just a preference. "7 October 2026"
 * is British order, and his standing rule is American English - the same rule
 * that gave us enrollment over enrolment and program over programme. A date a
 * Florida parent reads should be written the way a Florida parent writes one.
 *
 * THIS IS THE ONLY PLACE ANY APPOINTMENT TIME IS FORMATTED, so the change
 * reaches tours, interest meetings and shadow days together. That is the
 * point of the file: on 1 October three families were told the wrong hour
 * because a second, private formatting existed somewhere else.
 */

const EASTERN = "America/New_York";

function parts(iso: string, options: Intl.DateTimeFormatOptions) {
  const found = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN,
    ...options,
  }).formatToParts(new Date(iso));
  return (type: string) => found.find((p) => p.type === type)?.value ?? "";
}

/** "Wednesday, October 7, 2026 @ 3:15 PM" */
export function appointmentTextForFamily(iso: string): string {
  const part = parts(iso, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return (
    `${part("weekday")}, ${part("month")} ${part("day")}, ${part("year")}` +
    ` @ ${part("hour")}:${part("minute")} ${part("dayPeriod")}`
  );
}

/**
 * Just the clock: "3:15 PM".
 *
 * For a letter that has already said which day it means. The reminder sent
 * the evening before reads "our meeting to discuss Callum tomorrow at
 * 3:15 PM" - putting the full date after the word "tomorrow" would be both
 * redundant and faintly absurd.
 *
 * Written as a second function rather than an argument to the first, because
 * a caller choosing a format is a caller that can choose wrongly, and the one
 * thing this file exists to prevent is a time rendered somewhere nobody
 * thought to check.
 */
export function appointmentTimeForFamily(iso: string): string {
  const part = parts(iso, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${part("hour")}:${part("minute")} ${part("dayPeriod")}`;
}
