/**
 * What a family owes this month.
 *
 * The anchor case is real: Isla Fitzgerald's Square invoice, which is the only
 * independent check we have that this calculation matches what The Academy Way
 * actually charges. If that test ever fails, the calculator is wrong, not the
 * invoice.
 */

import { describe, expect, it } from "vitest";
import {
  computeMonthlyTuition,
  type BundleRule,
  type HeldItem,
} from "@/lib/finance/tuition-pricing";

// The Academy HS catalog, as priced on 2026-09-04.
const HS_EXPERIENCE = "hs-experience";
const LIFE_LAB = "hs-life-lab";
const ENTREPRENEURSHIP = "hs-entrepreneurship";
const EARTH_LAB = "hs-earth-lab";
const LIFE_MATH = "hs-life-math";
const HS_STRUCTURED_LITERACY = "hs-structured-literacy";

// The Academy Virtual.
const LIT_LAB = "virtual-lit-lab";
const DIGIT_LAB = "virtual-digit-lab";

const PACKAGE_MEMBERS = {
  [HS_EXPERIENCE]: [LIFE_LAB, ENTREPRENEURSHIP, EARTH_LAB],
};

const HS_BUNDLE: BundleRule = {
  id: "hs-bundle",
  name: "HS Experience bundle discount",
  packageItemId: HS_EXPERIENCE,
  minAdditionalItems: 1,
  amount: 100,
};

function item(overrides: Partial<HeldItem> & Pick<HeldItem, "itemId" | "label">): HeldItem {
  return { kind: "class", amount: 0, ...overrides };
}

function ok(result: ReturnType<typeof computeMonthlyTuition>) {
  if ("error" in result) throw new Error(`unexpected error: ${result.error}`);
  return result;
}

describe("Isla Fitzgerald's invoice", () => {
  // The one case with an outside witness.
  const isla: HeldItem[] = [
    item({ itemId: HS_EXPERIENCE, label: "The HS Experience", kind: "package", amount: 850 }),
    item({ itemId: HS_STRUCTURED_LITERACY, label: "Structured Literacy", amount: 850 }),
    item({ itemId: LIFE_MATH, label: "Life Math", amount: 350 }),
  ];

  it("computes package + two supplementals with one bundle discount", () => {
    const result = ok(computeMonthlyTuition(isla, PACKAGE_MEMBERS, [HS_BUNDLE]));
    expect(result.subtotal).toBe(2050);
    expect(result.discountTotal).toBe(100);
    expect(result.total).toBe(1950);
  });

  it("takes the discount once, not once per supplemental", () => {
    // Two supplementals. -$100, not -$200. This is the rule Jimmy stated and
    // the one the Square invoice shows.
    const result = ok(computeMonthlyTuition(isla, PACKAGE_MEMBERS, [HS_BUNDLE]));
    expect(result.appliedRules).toEqual(["hs-bundle"]);
    expect(result.lines.filter((l) => l.kind === "discount")).toHaveLength(1);
  });

  it("reproduces the original $1,850 at the prices that were in force then", () => {
    // Structured Literacy was $750 on the Square invoice and is $850 now. The
    // arithmetic is the same; only the price moved. This is the check that
    // tells us the gap is a pricing change and not a calculator bug.
    const atOldPrices = isla.map((h) =>
      h.itemId === HS_STRUCTURED_LITERACY ? { ...h, amount: 750 } : h
    );
    const result = ok(computeMonthlyTuition(atOldPrices, PACKAGE_MEMBERS, [HS_BUNDLE]));
    expect(result.total).toBe(1850);
  });
});

describe("holding a package means holding its classes", () => {
  it("does not charge twice for a class the package already covers", () => {
    // The likeliest way to overbill a family here: they hold the package and
    // somebody also adds Life Lab to their plan.
    const held: HeldItem[] = [
      item({ itemId: HS_EXPERIENCE, label: "The HS Experience", kind: "package", amount: 850 }),
      item({ itemId: LIFE_LAB, label: "Life Lab", amount: 350 }),
    ];
    const result = ok(computeMonthlyTuition(held, PACKAGE_MEMBERS, []));
    expect(result.subtotal).toBe(850);
    expect(result.total).toBe(850);
  });

  it("shows the covered class rather than hiding it", () => {
    // A parent asking "am I paying twice for Life Lab?" should be able to read
    // the answer, not be told the line does not exist.
    const held: HeldItem[] = [
      item({ itemId: HS_EXPERIENCE, label: "The HS Experience", kind: "package", amount: 850 }),
      item({ itemId: LIFE_LAB, label: "Life Lab", amount: 350 }),
    ];
    const result = ok(computeMonthlyTuition(held, PACKAGE_MEMBERS, []));
    expect(result.covered).toHaveLength(1);
    expect(result.covered[0]!.label).toBe("Life Lab");
    expect(result.covered[0]!.amount).toBe(0);
  });

  it("does not count a covered class toward the bundle discount", () => {
    // Holding the package plus one of its own classes is not "package plus a
    // supplemental". Counting it would hand out a discount nobody earned.
    const held: HeldItem[] = [
      item({ itemId: HS_EXPERIENCE, label: "The HS Experience", kind: "package", amount: 850 }),
      item({ itemId: EARTH_LAB, label: "Earth Lab", amount: 350 }),
    ];
    const result = ok(computeMonthlyTuition(held, PACKAGE_MEMBERS, [HS_BUNDLE]));
    expect(result.discountTotal).toBe(0);
    expect(result.total).toBe(850);
  });
});

describe("the bundle discount only fires when it should", () => {
  it("does not fire on the package alone", () => {
    const held = [
      item({ itemId: HS_EXPERIENCE, label: "The HS Experience", kind: "package", amount: 850 }),
    ];
    const result = ok(computeMonthlyTuition(held, PACKAGE_MEMBERS, [HS_BUNDLE]));
    expect(result.total).toBe(850);
    expect(result.appliedRules).toEqual([]);
  });

  it("does not fire on supplementals without the package", () => {
    const held = [
      item({ itemId: HS_STRUCTURED_LITERACY, label: "Structured Literacy", amount: 850 }),
      item({ itemId: LIFE_MATH, label: "Life Math", amount: 350 }),
    ];
    const result = ok(computeMonthlyTuition(held, PACKAGE_MEMBERS, [HS_BUNDLE]));
    expect(result.total).toBe(1200);
    expect(result.appliedRules).toEqual([]);
  });

  it("does not fire for a Virtual family — the rule is The Academy HS's", () => {
    // Per Jimmy: no Virtual equivalent. The Full School Program's saving is
    // already in its price.
    const held = [
      item({ itemId: LIT_LAB, label: "Lit Lab", amount: 425 }),
      item({ itemId: DIGIT_LAB, label: "Digit Lab", amount: 425 }),
    ];
    const result = ok(computeMonthlyTuition(held, {}, [HS_BUNDLE]));
    expect(result.total).toBe(850);
    expect(result.discountTotal).toBe(0);
  });

  it("never hands back more than the family owes", () => {
    // A rule bigger than the bill would turn an invoice into a credit.
    const held = [
      item({ itemId: HS_EXPERIENCE, label: "The HS Experience", kind: "package", amount: 40 }),
      item({ itemId: LIFE_MATH, label: "Life Math", amount: 10 }),
    ];
    const result = ok(computeMonthlyTuition(held, PACKAGE_MEMBERS, [HS_BUNDLE]));
    expect(result.total).toBe(0);
  });
});

describe("1:1 sessions", () => {
  it("charges sessions × the rate on top of tuition", () => {
    const held = [
      item({
        itemId: LIT_LAB,
        label: "Lit Lab",
        amount: 425,
        oneToOneSessions: 4,
        oneToOneSessionRate: 50,
      }),
    ];
    const result = ok(computeMonthlyTuition(held, {}, []));
    expect(result.total).toBe(625);
    expect(result.lines.find((l) => l.kind === "one_to_one")?.amount).toBe(200);
  });

  it("charges 1:1 even on a class the package covers", () => {
    // The package buys the class. It does not buy private sessions of it.
    const held: HeldItem[] = [
      item({ itemId: HS_EXPERIENCE, label: "The HS Experience", kind: "package", amount: 850 }),
      item({
        itemId: LIFE_LAB,
        label: "Life Lab",
        amount: 350,
        oneToOneSessions: 2,
        oneToOneSessionRate: 60,
      }),
    ];
    const result = ok(computeMonthlyTuition(held, PACKAGE_MEMBERS, []));
    // 850 for the package, 0 for the covered class, 120 for the sessions.
    expect(result.total).toBe(970);
  });

  it("adds nothing for zero sessions", () => {
    const held = [
      item({
        itemId: LIT_LAB,
        label: "Lit Lab",
        amount: 425,
        oneToOneSessions: 0,
        oneToOneSessionRate: 50,
      }),
    ];
    const result = ok(computeMonthlyTuition(held, {}, []));
    expect(result.total).toBe(425);
    expect(result.lines.filter((l) => l.kind === "one_to_one")).toHaveLength(0);
  });

  it("refuses when sessions were requested but no rate is set", () => {
    const held = [
      item({ itemId: LIT_LAB, label: "Lit Lab", amount: 425, oneToOneSessions: 3 }),
    ];
    const result = computeMonthlyTuition(held, {}, []);
    expect(result).toHaveProperty("error");
  });
});

describe("an unpriced item stops the whole calculation", () => {
  it("refuses rather than treating a missing price as free", () => {
    // This is the same principle as migration 248: a price nobody set is not
    // $0.00, and billing it as though it were is how a family is quietly
    // undercharged and the school quietly loses money.
    const held: HeldItem[] = [
      item({ itemId: HS_EXPERIENCE, label: "The HS Experience", kind: "package", amount: 850 }),
      item({ itemId: LIFE_MATH, label: "Life Math", amount: null }),
    ];
    const result = computeMonthlyTuition(held, PACKAGE_MEMBERS, [HS_BUNDLE]);
    expect(result).toHaveProperty("error");
    if ("error" in result) expect(result.error).toContain("Life Math");
  });

  it("does not refuse for an unpriced class the package already covers", () => {
    // Nothing is being charged for it, so its missing price cannot hurt anyone.
    const held: HeldItem[] = [
      item({ itemId: HS_EXPERIENCE, label: "The HS Experience", kind: "package", amount: 850 }),
      item({ itemId: LIFE_LAB, label: "Life Lab", amount: null }),
    ];
    const result = ok(computeMonthlyTuition(held, PACKAGE_MEMBERS, []));
    expect(result.total).toBe(850);
  });
});

describe("money stays money", () => {
  it("rounds to cents rather than accumulating float noise", () => {
    const held = [
      item({ itemId: LIT_LAB, label: "Lit Lab", amount: 0.1 }),
      item({ itemId: DIGIT_LAB, label: "Digit Lab", amount: 0.2 }),
    ];
    const result = ok(computeMonthlyTuition(held, {}, []));
    expect(result.total).toBe(0.3);
  });

  it("computes an empty plan as nothing owed, not as an error", () => {
    const result = ok(computeMonthlyTuition([], {}, [HS_BUNDLE]));
    expect(result.total).toBe(0);
    expect(result.lines).toHaveLength(0);
  });
});
