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
import { parseTuitionAmount } from "@/lib/finance/tuition-catalog-shared";

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
              one_to_one_amount: 1200,
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
              one_to_one_amount: null,
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
              one_to_one_amount: null,
              billing_frequency: "monthly",
              is_active: true,
            },
            {
              id: "p2",
              school_id: HS,
              catalog_item_id: "item-hs-experience",
              standard_amount: 850,
              one_to_one_amount: null,
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
              one_to_one_amount: null,
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
