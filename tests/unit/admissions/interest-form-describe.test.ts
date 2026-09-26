import { describe, expect, it } from "vitest";
import { describeCondition } from "@/lib/admissions/interest-form/describe";

const labels = {
  values: { "school-ga": "The Academy GA", "school-fl": "The Academy FL" },
  paths: { school_id: "Campus", funding_sources: "Funding" },
};

describe("saying when a section appears", () => {
  it("says nothing at all when there is no condition", () => {
    expect(describeCondition(null, labels)).toBeNull();
    expect(describeCondition(undefined, labels)).toBeNull();
  });

  it("names the campus rather than printing its id", () => {
    expect(
      describeCondition({ all: [{ path: "school_id", op: "eq", value: "school-ga" }] }, labels)
    ).toBe("Campus is The Academy GA");
  });

  /* The dangerous case: a rule it cannot read must still be visible. Printing
     nothing would read as "always shown", which is the opposite of the truth. */
  it("prints an unknown id rather than going blank", () => {
    expect(
      describeCondition({ all: [{ path: "school_id", op: "eq", value: "unknown-id" }] }, labels)
    ).toBe("Campus is unknown-id");
  });

  it("prints a path it has no label for", () => {
    expect(describeCondition({ all: [{ path: "mystery", op: "exists" }] })).toBe(
      "mystery has been answered"
    );
  });

  it("joins a list as or, because in means any of these", () => {
    expect(
      describeCondition(
        { all: [{ path: "school_id", op: "in", value: ["school-ga", "school-fl"] }] },
        labels
      )
    ).toBe("Campus is The Academy GA or The Academy FL");
  });

  it("asks contains of the answer, not of the rule", () => {
    expect(
      describeCondition({ all: [{ path: "funding_sources", op: "contains", value: "GA GOAL" }] }, labels)
    ).toBe("Funding includes GA GOAL");
  });

  it("joins several all conditions with and", () => {
    expect(
      describeCondition(
        {
          all: [
            { path: "school_id", op: "eq", value: "school-ga" },
            { path: "funding_sources", op: "exists" },
          ],
        },
        labels
      )
    ).toBe("Campus is The Academy GA and Funding has been answered");
  });

  it("brackets an any group so the reading cannot flip", () => {
    expect(
      describeCondition(
        {
          all: [{ path: "funding_sources", op: "exists" }],
          any: [
            { path: "school_id", op: "eq", value: "school-ga" },
            { path: "school_id", op: "eq", value: "school-fl" },
          ],
        },
        labels
      )
    ).toBe(
      "Funding has been answered and (Campus is The Academy GA or Campus is The Academy FL)"
    );
  });

  it("descends into a nested group", () => {
    expect(
      describeCondition(
        {
          all: [
            { path: "school_id", op: "eq", value: "school-ga" },
            { any: [{ path: "funding_sources", op: "contains", value: "GOAL" }] },
          ],
        },
        labels
      )
    ).toBe("Campus is The Academy GA and Funding includes GOAL");
  });

  it("returns null for a group with nothing in it", () => {
    expect(describeCondition({ all: [] }, labels)).toBeNull();
  });

  it("says a blank comparison value is blank rather than printing nothing", () => {
    expect(describeCondition({ all: [{ path: "school_id", op: "eq", value: "" }] }, labels)).toBe(
      "Campus is (blank)"
    );
  });
});
