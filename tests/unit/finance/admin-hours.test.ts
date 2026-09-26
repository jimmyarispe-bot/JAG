/**
 * SUPERSEDED by weekly-work.test.ts, 25 September 2026.
 *
 * Admin hours and tutoring sessions became one mechanism; their tests moved
 * with them. Kept as a pointer because Claude cannot delete files over the
 * device bridge - safe to remove.
 */
import { describe, expect, it } from "vitest";
import { weeklyWorkKind } from "@/lib/finance/weekly-work";

describe("admin hours moved", () => {
  it("still exists, as a kind of weekly work", () => {
    expect(weeklyWorkKind("admin_hourly")).toBeTruthy();
  });
});
