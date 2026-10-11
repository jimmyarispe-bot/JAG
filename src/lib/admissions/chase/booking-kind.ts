/**
 * WHICH KIND OF APPOINTMENT A CALENDAR ENTRY IS.
 *
 * A PURE STRING FUNCTION, IN ITS OWN FILE, AND THE REASON IS THE TEST.
 * calendar.ts opens with `import "server-only"`, which Next resolves and
 * vitest cannot - the package is not in node_modules and there is no alias
 * for it in vitest.config.ts. A test importing this from there fails to
 * resolve before it runs a single assertion. Nothing here touches the
 * network, the database or a request, so nothing here needs to be server
 * only, and keeping it apart is what lets it be tested at all.
 */
/**
 * WHAT KIND OF APPOINTMENT THIS IS, READ OFF ITS OWN TITLE.
 *
 * Jimmy, 11 October, when told the scan guesses the kind from the child's
 * stage: "isn't the title telling us what it is". It is, and the scan has
 * been carrying it unread since the day it was built.
 *
 * WHAT THAT COST. Checked against every booking the scan has matched - five
 * tours and a shadow day filed as interest meetings:
 *
 *   Meetings with Heather Badger-Brown   9   interest   correct
 *   Parent Interest Call                 6   interest   correct
 *   30 min with Nina                     3   interest   correct
 *   School Visit(Tour)                   3   TOUR       filed as interest
 *   Academy FL School Tours              1   TOUR       filed as interest
 *   School Tour for the Broyld Family    1   TOUR       filed as both
 *   Shadow days                          1   SHADOW     filed as both
 *
 * On 11 October the last of those reached Danni as a letter asking her to
 * write up an interest conversation about a school tour.
 *
 * ── THIS IS NOT THE NAME MATCHING THAT IS FORBIDDEN ─────────────────────────
 *
 * matchBookingToLead above says NO NAME MATCHING, EVER, and means it: three
 * faults in a fortnight came from identifying a PERSON by name, the worst of
 * them splitting ten children into twenty records. That rule stands and is
 * untouched. WHICH FAMILY a booking belongs to is still decided only by an
 * exact address match.
 *
 * This answers a different question - WHAT KIND of appointment it is - and
 * the title is the best evidence there is for it, because it is not typed by
 * a parent. It is the name of the Google booking page a school leader set up
 * once, and every family who clicks that page produces it verbatim. Getting
 * it wrong mislabels a meeting; it can never attach one to the wrong child.
 *
 * ── WORDS, NOT A LIST OF EXACT TITLES ───────────────────────────────────────
 *
 * Jimmy, 11 October: "so i need to tell the school leaders exactly how to
 * title their appts?" No. Matching on the word rather than the whole string
 * is what makes that true - "Academy FL School Tours", "School Visit(Tour)"
 * and "School Tour for the Broyld Family" all carry "tour" and all three are
 * caught without anybody standardising anything.
 *
 * ── AND IT REFUSES RATHER THAN GUESSES ──────────────────────────────────────
 *
 * Nine of the twenty-eight matched bookings are not from a booking page at
 * all - "Jennifer & Heather", "Kimberly Lopez" - meetings a leader typed into
 * her own calendar after booking them by telephone. Their titles say nothing
 * and no rule will ever make them. Those return null, and the caller falls
 * back to the stage exactly as it behaves today, so an unrecognised title is
 * never worse than the current behaviour. The caller reports them by name, so
 * a booking page nobody told us about is discovered by reading a run rather
 * than by a wrong letter.
 */
export type BookingKind = "tour" | "shadow_day" | "interest" | "assessment";

export function bookingKindFromTitle(summary: string | null): BookingKind | null {
  const title = (summary ?? "").toLowerCase();
  if (!title.trim()) return null;

  /*
   * ── THE FOUR WORDS ──────────────────────────────────────────────────────
   *
   * Jimmy, 11 October, having asked what the school leaders should put in a
   * title: "alright go ahead an make that a rule and i'll have the school
   * leaders do this." Then the four words, in his own wording, which is what
   * the school leaders are being told and therefore what is written here
   * rather than a tidier version of it:
   *
   *   Interest - anything involving interest meetings/calls
   *   Tour - anything involving tours at the school
   *   Shadow - when a student is shadowing at the school or in virtual
   *            classes
   *   Assessment - when you are scheduling a child for their assessments
   *
   * Each one anywhere in the title, any capitalisation.
   *
   * "CALL" IS DELIBERATELY NOT ONE OF THEM. He proposed it in the first list
   * and it did not survive: it is the one word that does not say WHICH thing
   * it is, since an interest call and an application call both answer to it.
   * Carrying the meaning on the distinguishing word is also what lets HS and
   * Virtual write "Virtual Interest Meeting" while GA and FL write "Interest
   * Conversation" - they share only the word that matters, which is exactly
   * the campus wording already approved.
   *
   * APPLICATION IS NOT IN THE SET EITHER. It was in the list proposed to him
   * and he replaced it with Assessment. A title saying "Application
   * conversation" therefore returns null and falls back to the stage, which
   * is today's behaviour and no worse. Adding it back is one line.
   *
   * ORDER MATTERS, so that a title carrying two words resolves to the more
   * specific one every time rather than to whichever happened to be tested
   * first. Shadow beats Tour: "Shadow Day Tour" is a shadow day. Assessment
   * beats Interest: "Assessment and interest follow-up" is the assessment.
   */

  /* "shadowing" as well as "shadow day" - his wording is "when a student is
     shadowing at the school or in virtual classes". */
  if (/\bshadow(?:s|ing|\s*days?)?\b/.test(title)) return "shadow_day";
  if (/\bassessments?\b/.test(title)) return "assessment";
  if (/\btours?\b/.test(title) || /\bschool\s*visit\b/.test(title)) return "tour";
  if (/\binterest\b/.test(title) || /\binquiry\b/.test(title)) return "interest";

  /*
   * ── A BRIDGE, AND IT IS MEANT TO BE DELETED ─────────────────────────────
   *
   * Two live booking pages carry none of the four words:
   *
   *   "Meetings with Heather Badger-Brown"   9 bookings, the busiest page
   *   "30 min with Nina"                     3 bookings
   *
   * Both are interest calls. Jimmy is renaming them to carry the word
   * Interest, but said on 11 October it "won't be today ... will be within
   * the next few days", and until then nine of Heather's families would fall
   * back to a stage guess for no reason.
   *
   * So these two lines read the SHAPE of a booking page rather than the
   * leader's name - a duration, or "Meetings with" - which means a new
   * leader's page also works the day it is made. It is still a guess, and a
   * guess is worse than a word.
   *
   * WHEN THOSE TWO PAGES CARRY "Interest", DELETE THIS BLOCK. Checking is one
   * query: the titles the scan has matched are listed in the run report.
   */
  if (/^\d+\s*(min|minute|hour)/.test(title)) return "interest";
  if (/^meetings?\s+with\b/.test(title)) return "interest";

  return null;
}
