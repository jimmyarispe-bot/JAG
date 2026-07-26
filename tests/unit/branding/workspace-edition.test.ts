import { describe, expect, it } from "vitest";
import { buildFallbackBranding } from "@/lib/branding/defaults";
import {
  formatWorkspaceProductLine,
  resolveWorkspaceEditionLabel,
} from "@/lib/branding/workspace-edition";

describe("workspace edition identity scoping", () => {
  const branding = buildFallbackBranding("org-1", "AcademyOS");

  it("shows Founder's Edition only for founders", () => {
    expect(
      resolveWorkspaceEditionLabel({ branding, isFounder: true })
    ).toBe("Founder's Edition");
    expect(
      resolveWorkspaceEditionLabel({ branding, isFounder: false, isExecutiveDirector: true })
    ).toBe("Executive Director of Schools");
    expect(
      resolveWorkspaceEditionLabel({ branding, isFounder: false, isExecutiveDirector: false })
    ).toBe("");
  });

  it("formats product line without Founder Edition for ED", () => {
    expect(
      formatWorkspaceProductLine({
        branding,
        isFounder: false,
        isExecutiveDirector: true,
        roleLabel: "Executive Director of Schools",
      })
    ).toBe("AcademyOS — Executive Director of Schools");

    expect(
      formatWorkspaceProductLine({
        branding,
        isFounder: true,
      })
    ).toBe("AcademyOS — Founder's Edition");
  });
});
