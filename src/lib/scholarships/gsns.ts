/**
 * GEORGIA SPECIAL NEEDS SCHOLARSHIP (GSNS) - THE LETTER AND THE SHARE.
 *
 * Jimmy, 20 October 2026: "when the parent uploads the scholarship document
 * into the jag, it should pull out the students student number and also the
 * total scholarship amount and include this automatcally in the students
 * financial information. however, according to these dates of enrollment
 * determines the percentage of the total scholarship amount they will
 * receive. we would need to receive the signed contract and first payment
 * before these dates for the corresponding scholarship percentage to apply -
 * September 5th for 100% November 6th for 75% January 8th for 50% April 9th
 * for 25%"
 *
 * GSNS only (Jimmy, same day). Pure: no database, no clock of its own.
 */

/** Our funding_program_catalog code for GSNS. */
export const GSNS_PROGRAM_CODE = "ga_esa";
export const GSNS_PROGRAM_NAME = "GA Special Needs Scholarship";

export interface GsnsLetter {
  studentName: string | null;
  /** Georgia's student number. */
  gtid: string | null;
  /** "2026-2027" */
  schoolYear: string | null;
  /** Total Scholarship Amount Awarded - the full-year figure. */
  totalAward: number | null;
}

/** True when the text reads as a GaDOE Special Needs Scholarship letter. */
export function isGsnsLetter(text: string): boolean {
  return /special\s+needs\s+scholarship/i.test(text) && /georgia/i.test(text);
}

function money(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Reads the four facts off the letter's text. Anything not found is null. */
export function parseGsnsLetter(text: string): GsnsLetter {
  const flat = text.replace(/\r/g, "");
  const gtid = flat.match(/\bGTID\b[\s:#]*([0-9]{6,12})/i)?.[1] ?? null;
  const name = flat.match(/Student Name[\s:]+([^\n]+?)\s*(?:\n|Date of Birth|$)/i)?.[1]?.trim() ?? null;
  const total =
    money(flat.match(/Total Scholarship Amount Awarded[\s:]*\$?\s*([0-9][0-9,]*\.?[0-9]{0,2})/i)?.[1]) ??
    money(flat.match(/Total Scholarship Amount[^\n$]*\$\s*([0-9][0-9,]*\.?[0-9]{0,2})/i)?.[1]);
  // No trailing \b: the PDF's text runs "2026 - 2027School Year:" together.
  const year = flat.match(/(?<!\d)(20\d\d)\s*-\s*(20\d\d)(?!\d)/);
  return {
    studentName: name,
    gtid,
    schoolYear: year ? `${year[1]}-${year[2]}` : null,
    totalAward: total,
  };
}

export interface GsnsShare {
  /** 100, 75, 50, 25 - or 0 once the last date has passed. */
  percent: number;
  /** Both must arrive before this date (the day before is the last day). Null at 0%. */
  deadline: string | null;
}

/** First calendar year of "2026-2027". Null if the year cannot be read. */
export function startYearOf(awardYear: string): number | null {
  const m = awardYear.match(/(20\d\d)/);
  return m ? Number(m[1]) : null;
}

/**
 * The share for a given day (YYYY-MM-DD, Eastern). Both must arrive BEFORE the
 * deadline: on Nov 6 itself it is already 50% (Jimmy, 20 Oct 2026: "Day
 * before").
 */
export function gsnsShareOn(day: string, awardYear: string): GsnsShare | null {
  const y = startYearOf(awardYear);
  if (y === null) return null;
  const tiers: Array<[string, number]> = [
    [`${y}-09-05`, 100],
    [`${y}-11-06`, 75],
    [`${y + 1}-01-08`, 50],
    [`${y + 1}-04-09`, 25],
  ];
  for (const [deadline, percent] of tiers) {
    if (day < deadline) return { percent, deadline };
  }
  return { percent: 0, deadline: null };
}

/** Today in Eastern time, YYYY-MM-DD. Everyone else adjusts. */
export function easternToday(now: Date = new Date()): string {
  return easternDay(now);
}

export function easternDay(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** total x percent, to the cent. */
export function shareOf(total: number, percent: number): number {
  return Math.round(total * percent) / 100;
}

/**
 * The day the share is decided: the later of the contract signed and the first
 * payment. Null until both have happened.
 */
export function decidedOn(signedAt: string | null, firstPaidAt: string | null): string | null {
  if (!signedAt || !firstPaidAt) return null;
  const a = easternDay(signedAt);
  const b = easternDay(firstPaidAt);
  return a > b ? a : b;
}
