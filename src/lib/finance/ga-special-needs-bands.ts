/**
 * What fraction of a Georgia Special Needs award a student earns, by the date
 * they enrol.
 *
 * Jimmy, 27 September 2026: "ga special needs scholarships are prorated
 * according to the date the student enrolls -- these are September 5th for
 * 100%, November 6th for 75%, January 8th for 50%, April 9th for 25%".
 *
 * THIS IS NOT TUITION PRORATION AND MUST NOT BE FOLDED INTO IT. Tuition
 * prorates smoothly by month. This prorates in four steps on dates Georgia
 * chose. The two run against the same student and produce different shapes,
 * and the difference has a consequence worth knowing about:
 *
 *   A Georgia student starting 1 October pays 8/12 of tuition and receives
 *   75% of the award. Starting on 7 November - one day past the band, since
 *   the 6th still earns 75% - they pay 7/12 and receive 50%. Tuition falls by
 *   one twelfth; the award falls by a third.
 *
 *   At the $19,950 Georgia rate against a $10,000 full-year award, the family
 *   pays $5,800 starting 1 October and $6,637.50 starting 7 November. Starting
 *   five weeks LATER costs them $837.50 MORE.
 *
 * That cliff is Georgia's doing, not ours, and it is almost certainly correct.
 * It is written here because a rule with a cliff in it should be somewhere a
 * person can see the cliff.
 *
 * THE BAND DATES ARE ANCHORED TO THE SCHOOL YEAR, not to a fixed year. For a
 * year that opens in June 2026, September and November fall in 2026 and
 * January and April in 2027. Hard-coding the years would quietly expire.
 */

/** The four bands, in the order Georgia applies them. Day-of-year, no year. */
const BANDS: ReadonlyArray<{
  readonly onOrBefore: { readonly month: number; readonly day: number };
  readonly percent: number;
}> = [
  { onOrBefore: { month: 9, day: 5 }, percent: 100 },
  { onOrBefore: { month: 11, day: 6 }, percent: 75 },
  { onOrBefore: { month: 1, day: 8 }, percent: 50 },
  { onOrBefore: { month: 4, day: 9 }, percent: 25 },
];

function parts(iso: string, label: string): { y: number; m: number; d: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) {
    throw new Error(`${label} is not a date in YYYY-MM-DD form: ${JSON.stringify(iso)}.`);
  }
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

/** Comparable as a single integer, so no Date and no timezone. */
const ord = (y: number, m: number, d: number) => y * 10000 + m * 100 + d;

export interface GaBandResult {
  /** 100, 75, 50, 25 — or 0 when the student enrols after the last band closes. */
  readonly percent: number;
  /** The date this band runs to, for printing on the family's statement. */
  readonly bandCloses: string | null;
  /**
   * True when the enrolment date is past 9 April and no band applies.
   *
   * Zero is returned rather than thrown so a late enrolment is not blocked,
   * but this flag exists because zero may be the wrong answer: whether Georgia
   * awards nothing after 9 April, or awards a final 25%, is NOT confirmed. A
   * plan carrying this flag must not be marked final until somebody has
   * checked. Silently awarding zero would cost a family the whole scholarship.
   */
  readonly needsConfirmation: boolean;
}

/**
 * The award percentage for a student enrolling on `enrolmentDate`, within a
 * school year that opens on `schoolYearStartDate`.
 *
 * Both dates are YYYY-MM-DD. The school year start is used only to work out
 * which calendar year each band date falls in.
 */
export function gaSpecialNeedsBand(
  schoolYearStartDate: string,
  enrolmentDate: string
): GaBandResult {
  const year = parts(schoolYearStartDate, "School year start");
  const on = parts(enrolmentDate, "Enrolment date");

  for (const band of BANDS) {
    /*
     * September and November belong to the year the school year opened.
     * January and April belong to the year after. Deciding by month rather
     * than by position in the list keeps this true whether a campus opens in
     * June or in August.
     */
    const bandYear = band.onOrBefore.month >= year.m ? year.y : year.y + 1;
    const closes = ord(bandYear, band.onOrBefore.month, band.onOrBefore.day);

    if (ord(on.y, on.m, on.d) <= closes) {
      return {
        percent: band.percent,
        bandCloses: `${bandYear}-${String(band.onOrBefore.month).padStart(2, "0")}-${String(
          band.onOrBefore.day
        ).padStart(2, "0")}`,
        needsConfirmation: false,
      };
    }
  }

  return { percent: 0, bandCloses: null, needsConfirmation: true };
}

/**
 * The award in cents, given the full-year award and the enrolment date.
 *
 * Cents in, cents out, integers throughout — the same rule `plan-builder`
 * holds to. A scholarship that has been a float is a scholarship that will not
 * reconcile against what Georgia actually sends.
 */
export function gaSpecialNeedsAwardCents(
  fullYearAwardCents: number,
  schoolYearStartDate: string,
  enrolmentDate: string
): { readonly awardCents: number } & GaBandResult {
  if (!Number.isInteger(fullYearAwardCents) || fullYearAwardCents < 0) {
    throw new Error(
      `Full-year award must be a whole number of cents, not ${fullYearAwardCents}.`
    );
  }
  const band = gaSpecialNeedsBand(schoolYearStartDate, enrolmentDate);
  return {
    ...band,
    awardCents: Math.round((fullYearAwardCents * band.percent) / 100),
  };
}
