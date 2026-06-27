import { describe, expect, it } from "vitest";
import { validatePlatformRegistry } from "@/lib/platform/diagnostics/validate-registry";

describe("Platform registry build validation", () => {
  it("passes with the current student and employee registrations", () => {
    const result = validatePlatformRegistry();
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });
});
