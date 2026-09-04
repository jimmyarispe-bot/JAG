/**
 * Shapes shared by the tuition price grid's server loader and its client
 * component.
 *
 * Kept apart from `tuition-catalog.ts` because that module imports
 * `createAuthClient`, which reaches `next/headers`. A client component that
 * imports from it — even for a type — drags server-only code toward the browser
 * bundle, and the repo's client-boundary check exists to catch exactly that.
 */

export interface TuitionPriceRow {
  readonly priceId: string;
  readonly schoolId: string;
  readonly schoolName: string;
  readonly catalogItemId: string;
  readonly itemCode: string;
  readonly itemName: string;
  readonly itemKind: string;
  readonly description: string | null;
  readonly providerSchoolId: string;
  readonly providerSchoolName: string;
  /** False when the attending school is not the provider: owed school to school. */
  readonly billedToFamily: boolean;
  /** Price for one billing period. The period is `billingFrequency`. */
  readonly standardAmount: number | null;
  /** Which period `standardAmount` covers. Monthly for Virtual and HS. */
  readonly billingFrequency: string;
  /** Whether this item is sold 1:1 at all. */
  readonly offeredOneToOne: boolean;
  /** Price of ONE 1:1 session. The month's charge is sessions × this. */
  readonly oneToOneSessionRate: number | null;
  readonly isActive: boolean;
  readonly sortOrder: number;
}

export interface BundleDiscountRow {
  readonly id: string;
  readonly name: string;
  readonly packageItemId: string;
  readonly packageName: string;
  readonly minAdditionalItems: number;
  readonly amount: number;
}

export interface TuitionSchoolGroup {
  readonly schoolId: string;
  readonly schoolName: string;
  readonly rows: TuitionPriceRow[];
  /** How many rows still have no standard price. Nothing may bill for these. */
  readonly unpriced: number;
  /**
   * Bundle discounts this school applies. Shown on the screen because a rule
   * that silently takes money off an invoice is a rule nobody can check.
   */
  readonly bundleDiscounts: BundleDiscountRow[];
}

/**
 * The word for one billing period, for putting after an amount.
 *
 * A price with no stated period is how a school-year figure gets typed into a
 * monthly field. "$850" and "$850 / month" are not the same claim, and the
 * screen should only ever make the second one.
 */
export function periodLabel(billingFrequency: string): string {
  switch (billingFrequency) {
    case "monthly":
      return "month";
    case "annual":
      return "year";
    case "semester":
      return "semester";
    case "quarterly":
      return "quarter";
    case "weekly":
      return "week";
    case "per_session":
      return "session";
    default:
      // Better to show the raw value than to assert a period we do not know.
      return billingFrequency;
  }
}

/**
 * Parse a money field from a form.
 *
 * Empty means "unset this price", which is a real and useful state: NULL is how
 * the system knows it must not bill for this item yet. It is not the same as
 * zero, and conflating the two is how a family gets an invoice for $0.00.
 */
export function parseTuitionAmount(
  raw: FormDataEntryValue | string | null | undefined
): { value: number | null } | { error: string } {
  const text = String(raw ?? "").trim();
  if (text === "") return { value: null };

  const cleaned = text.replace(/[$,\s]/g, "");
  if (cleaned === "") return { error: `"${text}" is not a number.` };

  const n = Number(cleaned);
  if (!Number.isFinite(n)) return { error: `"${text}" is not a number.` };
  if (n < 0) return { error: "A price cannot be negative." };
  if (n > 1_000_000) return { error: "That price looks wrong — over $1,000,000." };

  return { value: Math.round(n * 100) / 100 };
}

/**
 * What a family owes this month for 1:1 sessions of one class.
 *
 * Deliberately returns null rather than 0 when the rate is unknown or the item
 * is not sold 1:1. Zero is a number somebody could bill; null is the system
 * saying it does not know, which is the only honest answer here.
 */
export function oneToOneMonthlyCharge(
  sessionRate: number | null,
  sessions: number
): number | null {
  if (sessionRate === null) return null;
  if (!Number.isInteger(sessions) || sessions < 0) return null;
  return Math.round(sessionRate * sessions * 100) / 100;
}
