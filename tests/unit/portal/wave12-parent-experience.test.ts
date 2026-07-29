import { describe, expect, it, beforeEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PARENT_EXPERIENCE_ENGINES,
  PARENT_EXPERIENCE_GUARDS,
  PARENT_EXPERIENCE_NAV,
  PARENT_QUICK_ACTIONS,
  createParentExperienceOrchestrator,
  listParentExperienceEvents,
  listParentExperienceEvidence,
  listParentExperienceMemory,
  listParentExperienceTwin,
  publishParentExperienceEvent,
  resetParentExperienceOpsForTests,
  summarizeAttendance,
  searchParentDocumentsInKnowledge,
} from "@/lib/portal/experience";
import { createKnowledgeEngine } from "@knowledge";

const root = process.cwd();

describe("Wave 1.2 Parent Experience", () => {
  beforeEach(() => {
    resetParentExperienceOpsForTests();
  });

  it("is product orchestration with platform guards", () => {
    expect(PARENT_EXPERIENCE_GUARDS.productExperienceOnly).toBe(true);
    expect(PARENT_EXPERIENCE_GUARDS.createsPlatformEngines).toBe(false);
    expect(PARENT_EXPERIENCE_GUARDS.duplicatesBusinessLogic).toBe(false);
    expect(PARENT_EXPERIENCE_GUARDS.oneParentPortal).toBe(true);
    expect(PARENT_EXPERIENCE_ENGINES).toContain("LearningIntelligenceEngine");
    expect(PARENT_EXPERIENCE_ENGINES).toContain("FinanceEngine");
    expect(PARENT_EXPERIENCE_ENGINES).toContain("KnowledgeEngine");
  });

  it("ships Wave 1.2 parent routes and docs", () => {
    const required = [
      "src/app/portal/page.tsx",
      "src/app/portal/children/page.tsx",
      "src/app/portal/learning/page.tsx",
      "src/app/portal/attendance/page.tsx",
      "src/app/portal/billing/page.tsx",
      "src/app/portal/contracts/page.tsx",
      "src/app/portal/support/page.tsx",
      "src/app/portal/profile/page.tsx",
      "src/lib/portal/experience/orchestrator.ts",
      "docs/academyos/portal/01_PARENT_EXPERIENCE.md",
    ];
    for (const rel of required) {
      expect(existsSync(join(root, rel)), rel).toBe(true);
    }
    expect(PARENT_EXPERIENCE_NAV.some((n) => n.href === "/portal/learning")).toBe(
      true
    );
    expect(PARENT_QUICK_ACTIONS.length).toBeGreaterThan(4);
    const catalog = readFileSync(
      join(root, "docs/platform/consolidation/02_FRONTEND_SCREEN_CATALOG.md"),
      "utf8"
    );
    expect(catalog).toContain("/portal/children");
    expect(catalog).toContain("/portal/billing");
  });

  it("publishes Twin, Evidence, and Memory for meaningful actions", () => {
    const org = "org-parent-wave12";
    publishParentExperienceEvent({
      type: "parent.dashboard_viewed",
      organizationId: org,
      recordType: "parent_portal",
      recordId: "user-1",
      projectLive: false,
    });
    publishParentExperienceEvent({
      type: "parent.message_sent",
      organizationId: org,
      recordType: "portal_message",
      recordId: "msg-1",
      projectLive: false,
    });
    expect(listParentExperienceEvents(org).length).toBe(2);
    expect(listParentExperienceTwin(org).length).toBe(2);
    expect(listParentExperienceEvidence(org).length).toBe(2);
    expect(listParentExperienceMemory(org).length).toBe(2);
  });

  it("summarizes attendance without inventing SIS rules", () => {
    const summary = summarizeAttendance([
      {
        id: "1",
        studentId: "s1",
        attendanceDate: "2026-07-01",
        status: "present",
        notes: null,
      },
      {
        id: "2",
        studentId: "s1",
        attendanceDate: "2026-07-02",
        status: "absent",
        notes: null,
      },
      {
        id: "3",
        studentId: "s1",
        attendanceDate: "2026-07-03",
        status: "tardy",
        notes: null,
      },
    ]);
    expect(summary.present).toBe(1);
    expect(summary.absent).toBe(1);
    expect(summary.tardy).toBe(1);
  });

  it("searches documents via KnowledgeEngine", () => {
    const org = "org-parent-docs";
    const engine = createKnowledgeEngine();
    engine.uploadDocument({
      organizationId: org,
      userId: "u1",
      title: "IEP Progress Report",
      content: "Student progress notes",
      typeKey: "iep",
      tags: ["parent-portal"],
    });
    const { results } = searchParentDocumentsInKnowledge({
      organizationId: org,
      query: "IEP",
    });
    expect(results.length).toBeGreaterThan(0);
  });

  it("orchestrator exposes journey methods without inventing engines", () => {
    const orch = createParentExperienceOrchestrator();
    expect(orch.guards.createsPlatformEngines).toBe(false);
    expect(typeof orch.sendMessage).toBe("function");
    expect(typeof orch.signForm).toBe("function");
    expect(typeof orch.updateProfile).toBe("function");
    expect(typeof orch.searchDocuments).toBe("function");
    expect(typeof orch.publishSupportTicket).toBe("function");
  });
});
