import { describe, expect, it } from "vitest";
import { canTransition } from "@/lib/hr-platform/lifecycle";

describe("employees module smoke", () => {
  it("shares HCM lifecycle rules with employee records", () => {
    expect(canTransition("active", "terminated")).toBe(true);
    expect(canTransition("retired", "active")).toBe(false);
  });
});
