/**
 * The tuition catalog.
 *
 * Two properties carry the whole model, and both are easy to lose quietly:
 *
 *   1. A blank price is NOT zero. NULL means "we may not bill for this yet".
 *      Zero means "this is free". Migration 248 exists because the system used
 *      to fill a missing price with a seeded number; the replacement must not
 *      fill it with 0.00 instead.
 *
 *   2. Who pays is DERIVED, never stored. If the attending school is not the
 *      school that provides the item, the money is owed school to school and
 *      the family is not billed. A boolean somebody has to remember to set is a
 *      boolean that will eventually be wrong.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  parseTuitionAmount,
  periodLabel,
  oneToOneMonthlyCharge,
} from "@/lib/finance/tuition-catalog-shared";

const createAuthClient = vi.fn();
vi.mock("@/lib/supabase/server-auth", () => ({
  createAuthClient: () => createAuthClient(),
}));

describe("a blank price is not a free one", () => {
  it("reads an empty box as 'not priced', not as zero", () => {
    for (const blank of ["", "   ", null, undefined]) {
      expect(parseTuitionAmount(blank)).toEqual({ value: null });
    }
  });

  it("still accepts a deliberate zero", () => {
    // A genuinely free class is a thing someone may want to record. It just
    // must be typed, not inferred from silence.
    expect(parseTuitionAmount("0")).toEqual({ value: 0 });
    expect(parseTuitionAmount("0.00")).toEqual({ value: 0 });
  });
});

describe("reading what a person typed", () => {
  it("accepts the ways people actually write money", () => {
    expect(parseTuitionAmount("850")).toEqual({ value: 850 });
    expect(parseTuitionAmount("$850")).toEqual({ value: 850 });
    expect(parseTuitionAmount("1,200")).toEqual({ value: 1200 });
    expect(parseTuitionAmount("$1,850.00")).toEqual({ value: 1850 });
    expect(parseTuitionAmount("  750.50  ")).toEqual({ value: 750.5 });
  });

  it("rounds to cents rather than carrying float noise into an invoice", () => {
    expect(parseTuitionAmount("10.005")).toEqual({ value: 10.01 });
    expect(parseTuitionAmount("333.333")).toEqual({ value: 333.33 });
  });

  it("refuses what is not a number instead of storing NaN", () => {
    for (const junk of ["abc", "$", "1.2.3", "twelve", "--5"]) {
      expect(parseTuitionAmount(junk)).toHaveProperty("error");
    }
  });

  it("refuses a negative price", () => {
    expect(parseTuitionAmount("-100")).toHaveProperty("error");
    expect(parseTuitionAmount("-$1,000")).toHaveProperty("error");
  });

  it("refuses a number too large to be a tuition figure", () => {
    // A fat finger on a monthly class price is a bill nobody catches until a
    // parent phones.
    expect(parseTuitionAmount("85000000")).toHaveProperty("error");
  });
});

// ---------------------------------------------------------------------------

const VIRTUAL = "school-virtual";
const HS = "school-hs";
const FL = "school-fl";

function makeClient(tables: Record<string, { data?: unknown; error?: unknown }>) {
  function builder(table: string) {
    const result = () => tables[table] ?? { data: [], error: null };
    const b: Record<string, unknown> = {
      select: () => b,
      eq: () => b,
      order: () => b,
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
        Promise.resolve(result()).then(res, rej),
    };
    return b;
  }
  return { from: (t: string) => builder(t) };
}

const SCHOOLS = {
  data: [
    { id: VIRTUAL, name: "The Academy Virtual" },
    { id: HS, name: "The Academy HS" },
    { id: FL, name: "The Academy FL" },
  ],
};

const ITEMS = {
  data: [
    {
      id: "item-lit-lab",
      item_code: "virtual_lit_lab",
      display_name: "Lit Lab",
      item_kind: "class",
      provider_school_id: VIRTUAL,
      description: "Foundational class",
      sort_order: 10,
    },
    {
      id: "item-hs-experience",
      item_code: "hs_experience",
      display_name: "The HS Experience",
      item_kind: "package",
      provider_school_id: HS,
      description: null,
      sort_order: 100,
    },
  ],
};

async function loadGrid() {
  const mod = await import("@/lib/finance/tuition-catalog");
  return mod.listTuitionPriceGrid();
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("who pays is derived, not stored", () => {
  it("bills the family when the school provides its own item", async () => {
    createAuthClient.mockResolvedValue(
      makeClient({
        schools: SCHOOLS,
        tuition_catalog_items: ITEMS,
        tuition_school_prices: {
          data: [
            {
              id: "price-1",
              school_id: VIRTUAL,
              catalog_item_id: "item-lit-lab",
              standard_amount: 750,
              offered_one_to_one: true,
              one_to_one_session_rate: 95,
              billing_frequency: "monthly",
              is_active: true,
            },
          ],
        },
      })
    );

    const result = await loadGrid();
    if ("error" in result) throw new Error(result.error);

    const row = result.groups[0]!.rows[0]!;
    expect(row.billedToFamily).toBe(true);
    expect(row.providerSchoolName).toBe("The Academy Virtual");
  });

  it("owes it school to school when a campus takes another school's class", async () => {
    createAuthClient.mockResolvedValue(
      makeClient({
        schools: SCHOOLS,
        tuition_catalog_items: ITEMS,
        tuition_school_prices: {
          data: [
            {
              id: "price-2",
              school_id: FL,
              catalog_item_id: "item-lit-lab",
              standard_amount: 500,
              offered_one_to_one: false,
              one_to_one_session_rate: null,
              billing_frequency: "monthly",
              is_active: true,
            },
          ],
        },
      })
    );

    const result = await loadGrid();
    if ("error" in result) throw new Error(result.error);

    const row = result.groups[0]!.rows[0]!;
    // No family is billed for this. The Academy FL owes The Academy Virtual.
    expect(row.billedToFamily).toBe(false);
    expect(row.schoolName).toBe("The Academy FL");
    expect(row.providerSchoolName).toBe("The Academy Virtual");
  });
});

describe("what the grid tells a school leader", () => {
  it("counts what is not priced, because those cannot be billed", async () => {
    createAuthClient.mockResolvedValue(
      makeClient({
        schools: SCHOOLS,
        tuition_catalog_items: ITEMS,
        tuition_school_prices: {
          data: [
            {
              id: "p1",
              school_id: VIRTUAL,
              catalog_item_id: "item-lit-lab",
              standard_amount: null,
              offered_one_to_one: false,
              one_to_one_session_rate: null,
              billing_frequency: "monthly",
              is_active: true,
            },
            {
              id: "p2",
              school_id: HS,
              catalog_item_id: "item-hs-experience",
              standard_amount: 850,
              offered_one_to_one: false,
              one_to_one_session_rate: null,
              billing_frequency: "monthly",
              is_active: true,
            },
          ],
        },
      })
    );

    const result = await loadGrid();
    if ("error" in result) throw new Error(result.error);

    const hs = result.groups.find((g) => g.schoolName === "The Academy HS")!;
    const virtual = result.groups.find((g) => g.schoolName === "The Academy Virtual")!;
    expect(virtual.unpriced).toBe(1);
    expect(hs.unpriced).toBe(0);
  });

  it("says which read failed rather than showing an empty grid", async () => {
    // An RLS refusal and "no prices configured" look identical if the error is
    // swallowed, and one of them is a lie.
    createAuthClient.mockResolvedValue(
      makeClient({
        schools: SCHOOLS,
        tuition_catalog_items: ITEMS,
        tuition_school_prices: { data: null, error: { message: "permission denied" } },
      })
    );

    const result = await loadGrid();
    expect(result).toHaveProperty("error");
    if ("error" in result) expect(result.error).toContain("permission denied");
  });

  it("drops a price whose catalog item is gone rather than rendering a blank row", async () => {
    createAuthClient.mockResolvedValue(
      makeClient({
        schools: SCHOOLS,
        tuition_catalog_items: ITEMS,
        tuition_school_prices: {
          data: [
            {
              id: "orphan",
              school_id: VIRTUAL,
              catalog_item_id: "item-that-was-deactivated",
              standard_amount: 100,
              offered_one_to_one: false,
              one_to_one_session_rate: null,
              billing_frequency: "monthly",
              is_active: true,
            },
          ],
        },
      })
    );

    const result = await loadGrid();
    if ("error" in result) throw new Error(result.error);
    expect(result.groups).toHaveLength(0);
  });
});

describe("1:1 is priced per session, not per month", () => {
  it("multiplies the rate by the sessions a parent asked for", () => {
    // Lit Lab at $95 a session, eight sessions this month.
    expect(oneToOneMonthlyCharge(95, 8)).toBe(760);
    expect(oneToOneMonthlyCharge(112.5, 4)).toBe(450);
  });

  it("charges nothing for no sessions", () => {
    expect(oneToOneMonthlyCharge(95, 0)).toBe(0);
  });

  it("refuses to guess when the rate is unknown", () => {
    // Null, not zero. Zero is a number somebody could bill; null is the system
    // saying it does not know, which is the only honest answer.
    expect(oneToOneMonthlyCharge(null, 8)).toBeNull();
  });

  it("refuses a session count that is not a whole non-negative number", () => {
    expect(oneToOneMonthlyCharge(95, -1)).toBeNull();
    expect(oneToOneMonthlyCharge(95, 2.5)).toBeNull();
  });

  it("rounds to cents", () => {
    expect(oneToOneMonthlyCharge(33.333, 3)).toBe(100);
  });
});

describe("every amount states its period", () => {
  it("names the period for each billing frequency", () => {
    expect(periodLabel("monthly")).toBe("month");
    expect(periodLabel("annual")).toBe("year");
    expect(periodLabel("semester")).toBe("semester");
    expect(periodLabel("quarterly")).toBe("quarter");
    expect(periodLabel("weekly")).toBe("week");
    expect(periodLabel("per_session")).toBe("session");
  });

  it("shows an unknown frequency rather than asserting a period it does not know", () => {
    // Silently calling something "month" because we have no label for it is
    // how an annual figure gets read as monthly.
    expect(periodLabel("fortnightly")).toBe("fortnightly");
  });
});

describe("not offered and not priced are different facts", () => {
  it("reads offered_one_to_one straight through rather than inferring it from a blank", async () => {
    createAuthClient.mockResolvedValue(
      makeClient({
        schools: SCHOOLS,
        tuition_catalog_items: ITEMS,
        tuition_school_prices: {
          data: [
            {
              id: "offered-unpriced",
              school_id: VIRTUAL,
              catalog_item_id: "item-lit-lab",
              standard_amount: 750,
              billing_frequency: "monthly",
              offered_one_to_one: true,
              one_to_one_session_rate: null,
              is_active: true,
            },
          ],
        },
      })
    );

    const result = await loadGrid();
    if ("error" in result) throw new Error(result.error);

    const row = result.groups[0]!.rows[0]!;
    // Sold 1:1, just not priced yet. The old screen called this "not offered".
    expect(row.offeredOneToOne).toBe(true);
    expect(row.oneToOneSessionRate).toBeNull();
  });
});
