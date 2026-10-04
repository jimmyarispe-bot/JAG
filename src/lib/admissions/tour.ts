/**
 * WHICH CAMPUSES RUN TOURS, AND THE REFUSAL THAT KEEPS AN EMPTY LINK OUT OF A
 * PARENT'S INBOX.
 *
 * Decided 3 October ("the fork is at the interest meeting") and extended on
 * 4 October: at GA and FL the inquiry call is followed by a TOUR, and the
 * application comes after it. At Virtual and HS there is no tour at all -
 * tours are a physical-campus thing, which migration 263 says in its own note
 * and which the data already agrees with: both of those campuses have an empty
 * schools.tour_booking_url and always have.
 *
 * NO `import "server-only"` IN THIS FILE. Adding it to email/divert.ts on
 * 3 October failed a Vercel build in eight seconds, because a client component
 * two imports away pulls the module graph with it. This file is imported by
 * the post-call page, which is a server component today and may not stay one.
 *
 * ── WHY THE CAMPUS IS KEYED ON ITS NAME ──────────────────────────────────────
 *
 * Because there is nothing better, and pretending otherwise would be worse.
 * `schools` has six columns - address, name, organization_id, region_id,
 * timezone - and not one of them says what kind of school this is. Migrations
 * 493 and 496 already select campuses by `where name in (...)`, so this is the
 * convention rather than a new idea.
 *
 * THE RISK IS REAL AND WORTH STATING: rename a school in the JAG and this
 * silently changes which families are asked to tour. If a campus is ever
 * renamed, this list is the thing to update, and `assertKnownCampus` below
 * will not catch it - a name that is not on the list reads as "no tours",
 * which fails quiet. That is the trade for not inventing a column; the day
 * `schools` grows a campus_type, this module becomes three lines.
 *
 * ── WHY POLICY AND CONFIGURATION ARE CHECKED SEPARATELY ─────────────────────
 *
 * It is tempting to say "a campus runs tours if it has a tour calendar", and
 * read the policy straight off tour_booking_url. That is wrong in a way that
 * only shows up on a bad day: if Danni's link is ever blanked - a mis-save, a
 * migration, a cleared field - GA would silently stop offering tours and every
 * family would route straight to the application, with nothing anywhere saying
 * so. A missing calendar is a BROKEN CONFIGURATION, not a change of policy,
 * and it has to read as an error.
 *
 * So: the name says whether a tour is meant to happen. The URL says whether it
 * CAN. When they disagree, requireTourLink refuses and says which campus.
 */

/**
 * The campuses where a tour sits between the inquiry call and the application.
 *
 * Exactly the two with a physical building. Virtual and HS are absent on
 * purpose, not by omission.
 */
export const TOUR_CAMPUS_NAMES: readonly string[] = [
  "The Academy GA",
  "The Academy FL",
];

/** Trimmed, case-insensitive: a stray space in the JAG must not change a path. */
function normalize(name: string | null | undefined): string {
  return (name ?? "").trim().toLowerCase();
}

const TOUR_CAMPUS_SET = new Set(TOUR_CAMPUS_NAMES.map(normalize));

/**
 * Does this campus put a tour between the inquiry call and the application?
 *
 * Unknown name reads as NO, which is the safe direction: a family who is not
 * asked to tour still reaches the application through the path that has worked
 * since September. The opposite default would strand them behind a step their
 * campus cannot deliver.
 */
export function campusRunsTours(schoolName: string | null | undefined): boolean {
  return TOUR_CAMPUS_SET.has(normalize(schoolName));
}

/**
 * IS THE TOUR STEP SWITCHED ON? Off by default, and it must stay off until
 * two letters Jimmy has not yet written exist and are active.
 *
 * ── WHY THIS SWITCH EXISTS AT ALL ───────────────────────────────────────────
 *
 * Arming the gate move is the single most dangerous line in the tour work. It
 * makes invite_to_apply stop opening when a GA or FL family reaches
 * "Interest Meeting Held", on the understanding that a tour comes next. If it
 * is armed before the tour invitation letter exists, the consequence is not a
 * missing email - it is that EVERY GA AND FL FAMILY STOPS DEAD at the interest
 * meeting. No gate opens, no leader is asked anything, nothing chases it, and
 * the board looks exactly as it does on a quiet week. It would be days before
 * anybody noticed, and the families who inquired in the meantime would simply
 * never hear from us again.
 *
 * So the whole path ships built, reviewable and inert, and one switch turns it
 * on when the letters are real.
 *
 * ── WHAT MUST BE TRUE BEFORE IT IS ARMED ────────────────────────────────────
 *
 *   1. staff_inquiry_call_held   is written, approved and ACTIVE at GA and FL
 *   2. tour_invitation_sent      is written, approved and ACTIVE at GA and FL
 *   3. both campuses have a tour booking link - they do, since 5 September
 *   4. one family has been walked through the whole path on purpose
 *
 * ── HOW TO ARM IT ───────────────────────────────────────────────────────────
 *
 * Set ADMISSIONS_TOUR_GATE=on in Vercel and redeploy. An environment variable
 * rather than a constant so it can be turned OFF again in a minute without a
 * deploy, which is the direction that matters when something is wrong. Any
 * other value, or none, means off.
 */
export function tourGateArmed(): boolean {
  return (process.env.ADMISSIONS_TOUR_GATE ?? "").trim().toLowerCase() === "on";
}

export interface TourLinkRefusal {
  ok: false;
  error: string;
}

export interface TourLinkOk {
  ok: true;
  url: string;
}

/**
 * The guard that stands between an unconfigured campus and a letter reading
 * "You can book here: " with nothing after it.
 *
 * That exact failure is why inquiry_thank_you_email has a no-link twin, and
 * why shadow_days_link's comment in merge-fields.ts reads the way it does. The
 * tour letter does not get a twin: there is no useful version of "come and see
 * the school" that omits when. So this refuses instead, and the refusal names
 * the campus and the field, because the person who has to fix it is a school
 * leader looking at a screen, not an engineer reading a stack trace.
 */
export function requireTourLink(input: {
  schoolName: string | null | undefined;
  tourUrl: string | null | undefined;
}): TourLinkOk | TourLinkRefusal {
  const name = (input.schoolName ?? "").trim() || "This campus";
  const url = (input.tourUrl ?? "").trim();

  if (!campusRunsTours(input.schoolName)) {
    return {
      ok: false,
      error:
        `${name} does not run campus tours, so there is no tour to invite ` +
        `this family to. Tours are a GA and FL step.`,
    };
  }

  if (!url) {
    return {
      ok: false,
      error:
        `${name} has no tour booking link set, so the invitation would reach ` +
        `the family with nothing to click. Add one at ` +
        `/dashboard/admin/admissions-contacts under "Tour booking link", ` +
        `then send this again.`,
    };
  }

  if (!/^https:\/\//i.test(url)) {
    return {
      ok: false,
      error:
        `${name}'s tour booking link does not start with https:// , so it is ` +
        `not a link a parent can open. Fix it at ` +
        `/dashboard/admin/admissions-contacts.`,
    };
  }

  return { ok: true, url };
}
