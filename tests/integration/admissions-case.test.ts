import { describe, expect, it } from "vitest";
import "@/lib/platform/profile";
import { buildLegacyProfileSectionRedirectUrl } from "@/lib/platform/profile/params";
import {
  ADMISSIONS_CASE_LEGACY_REDIRECTS,
  ADMISSIONS_CASE_PROFILE_SECTION_COUNT,
  buildAdmissionsCaseHref,
  buildAdmissionsCaseSectionHref,
} from "@/lib/admissions/profile";
import { getCaseWorkflowState } from "@/lib/admissions/case/orchestration";
import { isRegisteredSection, resolveSectionKey } from "@/lib/platform/profile/registry";
import { isProfileSectionModuleRegistered } from "@/lib/platform/profile/sections";

describe("Admissions Case profile", () => {
  it("registers admissions_case profile kind with sections", () => {
    expect(isRegisteredSection("admissions_case", "overview")).toBe(true);
    expect(isRegisteredSection("admissions_case", "pipeline")).toBe(true);
    expect(isRegisteredSection("admissions_case", "decisions")).toBe(true);
    expect(isRegisteredSection("admissions_case", "relationships")).toBe(true);
    expect(ADMISSIONS_CASE_PROFILE_SECTION_COUNT).toBe(14);
  });

  it("registers native section modules for all case sections", () => {
    const keys = [
      "overview",
      "prospect",
      "pipeline",
      "applications",
      "documents",
      "visits",
      "communications",
      "tasks",
      "scholarships",
      "decisions",
      "enrollment",
      "notes",
      "activity",
      "relationships",
    ];
    for (const key of keys) {
      expect(isProfileSectionModuleRegistered("admissions_case", key)).toBe(true);
    }
  });

  it("builds canonical case workspace URLs", () => {
    expect(buildAdmissionsCaseHref("case-1")).toBe("/dashboard/admissions/cases/case-1");
    expect(buildAdmissionsCaseSectionHref("case-1", "pipeline")).toBe(
      "/dashboard/admissions/cases/case-1?section=pipeline"
    );
  });

  it("maps legacy lead detail tabs to case sections", () => {
    expect(
      buildLegacyProfileSectionRedirectUrl(
        "/dashboard/admissions/cases",
        "case-1",
        { tab: "decision" },
        ADMISSIONS_CASE_LEGACY_REDIRECTS
      )
    ).toBe("/dashboard/admissions/cases/case-1?section=decisions");
    expect(resolveSectionKey("admissions_case", "timeline")).toBe("activity");
  });

  it("resolves case workflow state from legacy lead stage", () => {
    const state = getCaseWorkflowState({ lead_stage: "application_submitted" });
    expect(state.pipelineStage).toBe("application_submitted");
    expect(state.allowedPipelineTransitions).toContain("documents_pending");
  });
});
