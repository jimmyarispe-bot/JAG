import { describe, expect, it } from "vitest";

import { schoolYearMonthSlots } from "@/lib/finance/plan-builder";

describe("HS bills only the months attended", () => {
  it("Harris Borum: 8 of 10 months is October 25, 2026 to May 25, 2027", () => {
    const slots = schoolYearMonthSlots("2027-05-31", 8);
    expect(slots.map((s) => s.dueDate)).toEqual([
      "2026-10-25",
      "2026-11-25",
      "2026-12-25",
      "2027-01-25",
      "2027-02-25",
      "2027-03-25",
      "2027-04-25",
      "2027-05-25",
    ]);
    expect(slots.every((s) => s.payable)).toBe(true);
    expect(slots[0].label).toBe("October tuition");
  });

  it("a full year is August to May", () => {
    expect(schoolYearMonthSlots("2027-05-31", 10)[0].dueDate).toBe("2026-08-25");
  });
});
