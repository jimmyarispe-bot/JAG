/**
 * What a family owes this month.
 *
 * Pure. No database, no session, no clock — hand it what the family holds and
 * what the school charges, and it returns the lines. Everything that could
 * differ between two runs is an argument, because a tuition calculation that
 * depends on ambient state is one nobody can check by reading it.
 *
 * The three rules it encodes, all of which came from how The Academy Way
 * actually bills rather than from what seemed tidy:
 *
 *   1. Holding a package means holding its classes. Charging for both is
 *      double billing, and it is the easiest mistake to make here.
 *   2. 1:1 is sessions × rate. The session count is a fact about this family
 *      this month; the rate is a fact about the class.
 *   3. A bundle discount fires ONCE. Isla Fitzgerald holds The HS Experience
 *      plus two supplementals and takes -$100, not -$200.
 */

export type ItemKind = "package" | "class" | "fee";

export interface HeldItem {
  /** Catalog item id. */
  readonly itemId: string;
  /** For readable lines and for tests that should fail loudly. */
  readonly label: string;
  readonly kind: ItemKind;
  /**
   * Price for the billing period. Null means unpriced — and an unpriced item
   * cannot be billed, so the whole calculation refuses rather than treating it
   * as free.
   */
  readonly amount: number | null;
  /** Sessions of 1:1 requested this month. Omit or 0 for none. */
  readonly oneToOneSessions?: number;
  readonly oneToOneSessionRate?: number | null;
}

export interface BundleRule {
  readonly id: string;
  readonly name: string;
  /** The package the family must hold for this rule to apply. */
  readonly packageItemId: string;
  /** How many other billable items they must also hold. */
  readonly minAdditionalItems: number;
  readonly amount: number;
}

export interface TuitionLine {
  readonly label: string;
  readonly amount: number;
  readonly kind: "item" | "one_to_one" | "discount";
  /** Set on lines suppressed because a held package already covers them. */
  readonly includedInPackage?: string;
}

export interface TuitionComputation {
  readonly lines: TuitionLine[];
  /** Items suppressed as already covered by a package. Shown, never charged. */
  readonly covered: TuitionLine[];
  readonly subtotal: number;
  readonly discountTotal: number;
  readonly total: number;
  readonly appliedRules: string[];
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * @param held           what this family holds this month
 * @param packageMembers package item id -> the item ids it contains
 * @param rules          bundle discounts for this school
 */
export function computeMonthlyTuition(
  held: readonly HeldItem[],
  packageMembers: Readonly<Record<string, readonly string[]>>,
  rules: readonly BundleRule[]
): TuitionComputation | { error: string } {
  const heldIds = new Set(held.map((h) => h.itemId));

  // Every class contained by a package this family actually holds.
  const coveredIds = new Set<string>();
  for (const item of held) {
    if (item.kind !== "package") continue;
    for (const memberId of packageMembers[item.itemId] ?? []) coveredIds.add(memberId);
  }

  const lines: TuitionLine[] = [];
  const covered: TuitionLine[] = [];
  let subtotal = 0;

  for (const item of held) {
    const isCovered = item.kind !== "package" && coveredIds.has(item.itemId);

    if (isCovered) {
      // Not charged, but not hidden either. A parent who asks "am I paying
      // twice for Life Lab?" deserves to see the answer on the invoice.
      covered.push({
        label: item.label,
        amount: 0,
        kind: "item",
        includedInPackage: "Included in the package",
      });
    } else {
      if (item.amount === null) {
        // Refusing beats guessing. A null price is the system saying it does
        // not know what to charge, and $0.00 is a different claim entirely.
        return { error: `${item.label} has no price set, so this cannot be billed yet.` };
      }
      lines.push({ label: item.label, amount: item.amount, kind: "item" });
      subtotal = round(subtotal + item.amount);
    }

    // 1:1 is charged even on a class the package covers — the package buys the
    // class, not private sessions of it.
    const sessions = item.oneToOneSessions ?? 0;
    if (sessions > 0) {
      if (!Number.isInteger(sessions) || sessions < 0) {
        return { error: `${item.label}: ${sessions} is not a valid number of sessions.` };
      }
      const rate = item.oneToOneSessionRate ?? null;
      if (rate === null) {
        return {
          error: `${item.label} has ${sessions} 1:1 session(s) but no session rate set.`,
        };
      }
      const amount = round(rate * sessions);
      lines.push({
        label: `${item.label} — ${sessions} × 1:1 session`,
        amount,
        kind: "one_to_one",
      });
      subtotal = round(subtotal + amount);
    }
  }

  // Discounts. Each rule fires at most once.
  let discountTotal = 0;
  const appliedRules: string[] = [];

  for (const rule of rules) {
    if (!heldIds.has(rule.packageItemId)) continue;

    // "Additional" means neither the package itself nor anything inside it.
    const packageOwnMembers = new Set(packageMembers[rule.packageItemId] ?? []);
    const additional = held.filter(
      (h) => h.itemId !== rule.packageItemId && !packageOwnMembers.has(h.itemId)
    ).length;

    if (additional < rule.minAdditionalItems) continue;

    lines.push({ label: rule.name, amount: -rule.amount, kind: "discount" });
    discountTotal = round(discountTotal + rule.amount);
    appliedRules.push(rule.id);
  }

  // A discount larger than the bill would hand the family a credit they did
  // not earn. Floor at zero and say nothing was owed.
  const total = Math.max(0, round(subtotal - discountTotal));

  return { lines, covered, subtotal, discountTotal, total, appliedRules };
}
