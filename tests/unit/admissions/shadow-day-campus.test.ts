import { describe, it, expect } from "vitest";

import {
  shadowDayCount,
  shadowDayType,
  shadowDayWords,
} from "@/lib/admissions/shadow-day";

/* Jimmy, 14 October 2026: "2 days @ ga n fl, 1 day @ hs n virtual".
   Until this file existed that fact lived only inside the letter bodies, which
   is how a family at HS came to be offered "Choose your shadow days", plural,
   for a single day. */

describe("how many shadow days each campus runs", () => {
  it("is two at GA, FL and the test campus", () => {
    expect(shadowDayCount("The Academy GA")).toBe(2);
    expect(shadowDayCount("The Academy FL")).toBe(2);
    expect(shadowDayCount("XXXXXXXX Test Campus")).toBe(2);
  });

  it("is one at HS and Virtual", () => {
    expect(shadowDayCount("The Academy HS")).toBe(1);
    expect(shadowDayCount("The Academy Virtual")).toBe(1);
  });

  it("is one for a campus nobody told this file about", () => {
    /* The smaller promise. A campus added without a decision recorded here
       should under-promise, not over-promise. */
    expect(shadowDayCount("The Academy Somewhere")).toBe(1);
    expect(shadowDayCount(null)).toBe(1);
    expect(shadowDayCount(undefined)).toBe(1);
  });
});

describe("where a shadow day happens", () => {
  it("is online only at Virtual", () => {
    expect(shadowDayType("The Academy Virtual")).toBe("online");
    for (const campus of [
      "The Academy GA",
      "The Academy FL",
      "The Academy HS",
      "XXXXXXXX Test Campus",
    ]) {
      expect(shadowDayType(campus)).toBe("in_person");
    }
  });

  it("is in person for an unknown campus", () => {
    expect(shadowDayType(null)).toBe("in_person");
  });
});

describe("the words a letter uses", () => {
  it("is plural where there are two days and singular where there is one", () => {
    expect(shadowDayWords("The Academy GA")).toBe("Shadow Days");
    expect(shadowDayWords("The Academy FL")).toBe("Shadow Days");
    expect(shadowDayWords("XXXXXXXX Test Campus")).toBe("Shadow Days");
    expect(shadowDayWords("The Academy HS")).toBe("Shadow Day");
    expect(shadowDayWords("The Academy Virtual")).toBe("Shadow Day");
  });
});
