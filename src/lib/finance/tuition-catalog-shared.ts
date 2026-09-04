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
  readonly standardAmount: number | null;
  readonly oneToOneAmount: number | null;
  readonly billingFrequency: string;
  readonly isActive: boolean;
  readonly sortOrder: number;
}

export interface TuitionSchoolGroup {
  readonly schoolId: string;
  readonly schoolName: string;
  readonly rows: TuitionPriceRow[];
  /** How many rows still have no standard price. Nothing may bill for these. */
  readonly unpriced: number;
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
