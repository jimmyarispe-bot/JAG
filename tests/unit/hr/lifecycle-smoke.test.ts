import { describe, expect, it } from "vitest";
import { canTransition, LIFECYCLE_STATES } from "@/lib/hr-platform";

describe("hr module smoke", () => {
  it("exports HCM lifecycle helpers used by HR dashboard", () => {
    expect(LIFECYCLE_STATES.length).toBeGreaterThanOrEqual(10);
    expect(canTransition("hired", "onboarding")).toBe(true);
  });
});
