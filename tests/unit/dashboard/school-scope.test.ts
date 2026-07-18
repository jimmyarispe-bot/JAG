import { describe, expect, it } from "vitest";
import {
  applySchoolFilter,
  hasNoSchoolAccess,
  matchesSchool,
} from "@/lib/dashboard/school-scope";

describe("dashboard school-scope helpers", () => {
  it("treats null as unrestricted and empty as no access", () => {
    expect(hasNoSchoolAccess(null)).toBe(false);
    expect(hasNoSchoolAccess([])).toBe(true);
    expect(hasNoSchoolAccess(["school-1"])).toBe(false);
  });

  it("matchesSchool excludes null school_id when scoped", () => {
    expect(matchesSchool(null, null)).toBe(true);
    expect(matchesSchool(["a"], null)).toBe(false);
    expect(matchesSchool(["a"], "a")).toBe(true);
    expect(matchesSchool(["a"], "b")).toBe(false);
    expect(matchesSchool([], "a")).toBe(false);
  });

  it("applySchoolFilter leaves query unchanged for null/empty", () => {
    const calls: Array<{ op: string; args: unknown[] }> = [];
    const query = {
      eq(col: string, val: string) {
        calls.push({ op: "eq", args: [col, val] });
        return this;
      },
      in(col: string, vals: string[]) {
        calls.push({ op: "in", args: [col, vals] });
        return this;
      },
    };

    applySchoolFilter(query, "school_id", null);
    applySchoolFilter(query, "school_id", []);
    expect(calls).toEqual([]);

    applySchoolFilter(query, "school_id", ["only"]);
    expect(calls).toEqual([{ op: "eq", args: ["school_id", "only"] }]);

    applySchoolFilter(query, "school_id", ["a", "b"]);
    expect(calls).toContainEqual({ op: "in", args: ["school_id", ["a", "b"]] });
  });
});
