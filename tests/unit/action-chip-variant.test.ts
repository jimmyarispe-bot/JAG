import { describe, expect, it } from "vitest";
import { inferActionChipVariant } from "@/components/experience-system/feedback/action-chip-styles";

describe("inferActionChipVariant (UX-003)", () => {
  it("maps primary workflow verbs", () => {
    expect(inferActionChipVariant("Open")).toBe("primary");
    expect(inferActionChipVariant("Continue")).toBe("primary");
    expect(inferActionChipVariant("Launch")).toBe("primary");
  });

  it("maps secondary inspection verbs", () => {
    expect(inferActionChipVariant("View")).toBe("secondary");
    expect(inferActionChipVariant("View Student")).toBe("secondary");
    expect(inferActionChipVariant("Details")).toBe("secondary");
  });

  it("maps success / warning / danger", () => {
    expect(inferActionChipVariant("Approve")).toBe("success");
    expect(inferActionChipVariant("Review Application")).toBe("warning");
    expect(inferActionChipVariant("Delete")).toBe("danger");
    expect(inferActionChipVariant("Reject")).toBe("danger");
  });

  it("maps ghost utilities", () => {
    expect(inferActionChipVariant("Dismiss")).toBe("ghost");
    expect(inferActionChipVariant("Explain recommendation")).toBe("ghost");
  });
});
