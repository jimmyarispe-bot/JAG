import { describe, expect, it, beforeEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ADMISSIONS_EXPERIENCE_ENGINES,
  ADMISSIONS_EXPERIENCE_GUARDS,
  ADMISSIONS_KNOWLEDGE_DOCUMENT_TYPES,
  ADMISSIONS_PUBLIC_NAV,
  APPLICATION_DASHBOARD_STATUSES,
  APPLICATION_WIZARD_STEPS,
  PARENT_ONBOARDING_CHECKLIST,
  createAdmissionsExperienceOrchestrator,
  linkAdmissionsDocumentToKnowledge,
  listAdmissionsExperienceEvents,
  listAdmissionsExperienceEvidence,
  listAdmissionsExperienceMemory,
  listAdmissionsExperienceTwin,
  publishAdmissionsExperienceEvent,
  resetAdmissionsExperienceOpsForTests,
  toDashboardStatus,
} from "@/lib/admissions/experience";
import { createKnowledgeEngine } from "@knowledge";

const root = process.cwd();

describe("Wave 1.1 Admissions Experience", () => {
  beforeEach(() => {
    resetAdmissionsExperienceOpsForTests();
  });

  it("is product orchestration with platform guards", () => {
    expect(ADMISSIONS_EXPERIENCE_GUARDS.productExperienceOnly).toBe(true);
    expect(ADMISSIONS_EXPERIENCE_GUARDS.createsPlatformEngines).toBe(false);
    expect(ADMISSIONS_EXPERIENCE_GUARDS.duplicatesBusinessLogic).toBe(false);
    expect(ADMISSIONS_EXPERIENCE_GUARDS.duplicatesDataModels).toBe(false);
    expect(ADMISSIONS_EXPERIENCE_GUARDS.knowledgeOwnsDocuments).toBe(true);
    expect(ADMISSIONS_EXPERIENCE_ENGINES).toContain("KnowledgeEngine");
    expect(ADMISSIONS_EXPERIENCE_ENGINES).toContain("LearningIntelligenceEngine");
    expect(ADMISSIONS_EXPERIENCE_ENGINES).toContain("FinanceEngine");
  });

  it("ships public admissions routes and experience docs", () => {
    const required = [
      "src/app/admissions/page.tsx",
      "src/app/admissions/programs/page.tsx",
      "src/app/admissions/locations/page.tsx",
      "src/app/admissions/virtual/page.tsx",
      "src/app/admissions/scholarships/page.tsx",
      "src/app/admissions/tuition/page.tsx",
      "src/app/admissions/faqs/page.tsx",
      "src/app/admissions/success-stories/page.tsx",
      "src/app/admissions/schedule-tour/page.tsx",
      "src/app/admissions/contact/page.tsx",
      "src/app/admissions/discovery-call/page.tsx",
      "src/app/admissions/assessment/page.tsx",
      "src/app/admissions/onboarding/page.tsx",
      "src/app/apply/portal/[applicationId]/wizard/page.tsx",
      "src/app/dashboard/admissions/experience/page.tsx",
      "docs/academyos/admissions/08_EXPERIENCE.md",
      "src/lib/admissions/experience/orchestrator.ts",
    ];
    for (const rel of required) {
      expect(existsSync(join(root, rel)), rel).toBe(true);
    }
    expect(ADMISSIONS_PUBLIC_NAV.some((n) => n.href === "/apply")).toBe(true);
    const catalog = readFileSync(
      join(root, "docs/platform/consolidation/02_FRONTEND_SCREEN_CATALOG.md"),
      "utf8"
    );
    expect(catalog).toContain("/admissions/**");
    expect(catalog).toContain("wizard");
  });

  it("covers wizard steps, dashboard statuses, docs, and onboarding checklist", () => {
    expect(APPLICATION_WIZARD_STEPS.length).toBeGreaterThanOrEqual(10);
    expect(APPLICATION_DASHBOARD_STATUSES).toContain("Enrolled");
    expect(APPLICATION_DASHBOARD_STATUSES).toContain("Waitlisted");
    expect(ADMISSIONS_KNOWLEDGE_DOCUMENT_TYPES.some((d) => d.type === "iep")).toBe(
      true
    );
    expect(PARENT_ONBOARDING_CHECKLIST.some((c) => c.id === "portal")).toBe(true);
    expect(toDashboardStatus({ applicationStatus: "submitted" })).toBe("Submitted");
    expect(toDashboardStatus({ pipelineStage: "interview_scheduled" })).toBe(
      "Interview Scheduled"
    );
  });

  it("publishes Twin, Evidence, and Memory sinks for meaningful actions", () => {
    const org = "org-admissions-wave11";
    publishAdmissionsExperienceEvent({
      type: "admissions.inquiry_submitted",
      organizationId: org,
      recordType: "admissions_lead",
      recordId: "lead-1",
      payload: { source: "test" },
      projectLive: false,
    });
    publishAdmissionsExperienceEvent({
      type: "admissions.application_submitted",
      organizationId: org,
      recordType: "admissions_application",
      recordId: "app-1",
      projectLive: false,
    });

    expect(listAdmissionsExperienceEvents(org).length).toBe(2);
    expect(listAdmissionsExperienceTwin(org).length).toBe(2);
    expect(listAdmissionsExperienceEvidence(org).length).toBe(2);
    expect(listAdmissionsExperienceMemory(org).length).toBe(2);
  });

  it("links document uploads to KnowledgeEngine without a parallel store", () => {
    const org = "org-admissions-docs";
    createKnowledgeEngine();
    return linkAdmissionsDocumentToKnowledge({
      organizationId: org,
      userId: "user-1",
      applicationId: "app-1",
      documentType: "iep",
      fileName: "iep.pdf",
      mimeType: "application/pdf",
      content: "JVBERi0xLjQ=",
    }).then((result) => {
      expect("error" in result).toBe(false);
      if ("knowledgeDocumentId" in result) {
        expect(result.knowledgeDocumentId).toBeTruthy();
      }
      expect(
        listAdmissionsExperienceEvents(org).some(
          (e) => e.type === "admissions.document_uploaded"
        )
      ).toBe(true);
    });
  });

  it("orchestrator exposes journey methods without inventing engines", () => {
    const orch = createAdmissionsExperienceOrchestrator();
    expect(orch.guards.createsPlatformEngines).toBe(false);
    expect(typeof orch.submitInterest).toBe("function");
    expect(typeof orch.requestDiscoveryCall).toBe("function");
    expect(typeof orch.requestAssessment).toBe("function");
    expect(typeof orch.saveApplicationDraft).toBe("function");
    expect(typeof orch.uploadDocument).toBe("function");
    expect(typeof orch.generateOffer).toBe("function");
    expect(typeof orch.signContract).toBe("function");
    expect(typeof orch.saveScholarship).toBe("function");
    expect(typeof orch.inviteParentOnboarding).toBe("function");
  });
});
