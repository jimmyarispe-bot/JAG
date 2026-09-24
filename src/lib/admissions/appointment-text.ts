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
 * gives "Thursday, 24 September 2026 at 1:00 PM" - en-US puts the month
 * first, en-GB uses a 24-hour clock.
 */
export function appointmentTextForFamily(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(iso));
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return (
    `${part("weekday")}, ${part("day")} ${part("month")} ${part("year")}` +
    ` at ${part("hour")}:${part("minute")} ${part("dayPeriod")}`
  );
}
