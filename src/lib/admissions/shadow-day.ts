/**
 * How many shadow days a campus runs, and whether a child attends in person.
 *
 * ── WHERE THESE FACTS LIVED BEFORE ─────────────────────────────────────────
 *
 * Only inside the letter bodies. "2 Shadow Days" is typed into GA, FL and the
 * test campus's shadow_days_invite_email and "1 Shadow Day" into HS and
 * Virtual's, and nothing in the code has ever known the difference. That is
 * how the button under those letters came to read "Choose your shadow days",
 * plural, to a family being offered one.
 *
 * Jimmy, 14 October 2026, asked directly: "2 days @ ga n fl, 1 day @ hs n
 * virtual". This is that answer, written where code can read it.
 *
 * ── IT IS THE SAME SPLIT AS THE TOUR, AND THAT IS A COINCIDENCE ─────────────
 *
 * GA, FL and the test campus run tours AND two shadow days. HS and Virtual run
 * neither a tour nor two. So TOUR_CAMPUS_NAMES would give the right answer
 * today, and reusing it would be wrong: it would make "how many shadow days"
 * a consequence of "does this campus run tours", which is not a thing anybody
 * decided. The day the HS runs a tour, or GA drops to one shadow day, the two
 * lists part company and only one of them should move.
 *
 * ── VIRTUAL'S SHADOW DAY IS NOT AT A SCHOOL ────────────────────────────────
 *
 * The Academy Virtual is online, so its shadow day is online. The tour letter
 * can say "meet them at the school" because only GA and FL run tours; a shadow
 * day letter cannot, and that is why the drafted letter has no such line.
 *
 * ── AN UNKNOWN CAMPUS GETS ONE DAY, IN PERSON ──────────────────────────────
 *
 * The conservative answer in both cases. One day is the smaller promise, and
 * in person is what four of the five campuses are. A campus this file has
 * never heard of is a campus somebody added without telling anybody, and the
 * failure that costs least is the one that under-promises.
 */

/** Two shadow days, not one. */
const TWO_DAY_CAMPUS_NAMES: readonly string[] = [
  "The Academy GA",
  "The Academy FL",
  /* The test campus is a copy of FL, including this. */
  "XXXXXXXX Test Campus",
];

/** Where a shadow day happens online rather than in a building. */
const ONLINE_CAMPUS_NAMES: readonly string[] = ["The Academy Virtual"];

export function shadowDayCount(schoolName: string | null | undefined): 1 | 2 {
  if (!schoolName) return 1;
  return TWO_DAY_CAMPUS_NAMES.includes(schoolName.trim()) ? 2 : 1;
}

export function shadowDayType(
  schoolName: string | null | undefined
): "in_person" | "online" {
  if (!schoolName) return "in_person";
  return ONLINE_CAMPUS_NAMES.includes(schoolName.trim()) ? "online" : "in_person";
}

/** "Shadow Days" at a two-day campus, "Shadow Day" at a one-day campus. */
export function shadowDayWords(schoolName: string | null | undefined): string {
  return shadowDayCount(schoolName) === 2 ? "Shadow Days" : "Shadow Day";
}
