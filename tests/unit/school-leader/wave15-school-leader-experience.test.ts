import { describe, expect, it, beforeEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SCHOOL_LEADER_EXPERIENCE_ENGINES,
  SCHOOL_LEADER_EXPERIENCE_GUARDS,
  SCHOOL_LEADER_EXPERIENCE_NAV,
  SCHOOL_LEADER_QUICK_ACTIONS,
  createSchoolLeaderExperienceOrchestrator,
  listSchoolLeaderExperienceEvents,
  listSchoolLeaderExperienceEvidence,
  listSchoolLeaderExperienceMemory,
  listSchoolLeaderExperienceTwin,
  publishSchoolLeaderExperienceEvent,
  resetSchoolLeaderExperienceOpsForTests,
} from "@/lib/school-leader/experience";

const root = process.cwd();

describe("Wave 1.5 School Leader Workspace", () => {
  beforeEach(() => {
    resetSchoolLeaderExperienceOpsForTests();
  });

  it("is product orchestration with platform guards", () => {
    expect(SCHOOL_LEADER_EXPERIENCE_GUARDS.productExperienceOnly).toBe(true);
    expect(SCHOOL_LEADER_EXPERIENCE_GUARDS.createsPlatformEngines).toBe(false);
    expect(SCHOOL_LEADER_EXPERIENCE_GUARDS.duplicatesBusinessLogic).toBe(false);
    expect(SCHOOL_LEADER_EXPERIENCE_GUARDS.duplicatesLearningIntelligence).toBe(false);
    expect(SCHOOL_LEADER_EXPERIENCE_GUARDS.duplicatesFinance).toBe(false);
    expect(SCHOOL_LEADER_EXPERIENCE_GUARDS.duplicatesKnowledge).toBe(false);
    expect(SCHOOL_LEADER_EXPERIENCE_GUARDS.duplicatesScheduling).toBe(false);
    expect(SCHOOL_LEADER_EXPERIENCE_GUARDS.duplicatesHrLogic).toBe(false);
    expect(SCHOOL_LEADER_EXPERIENCE_GUARDS.financeReadOnlySummaries).toBe(true);
    expect(SCHOOL_LEADER_EXPERIENCE_GUARDS.cfoReadOnlyOperationalSummaries).toBe(true);
    expect(SCHOOL_LEADER_EXPERIENCE_ENGINES).toContain("LearningIntelligenceEngine");
    expect(SCHOOL_LEADER_EXPERIENCE_ENGINES).toContain("FinanceEngine");
    expect(SCHOOL_LEADER_EXPERIENCE_ENGINES).toContain("ChiefFinancialOfficerEngine");
    expect(SCHOOL_LEADER_EXPERIENCE_ENGINES).toContain("OrganizationEngine");
  });

  it("ships Wave 1.5 school leader routes and docs", () => {
    const required = [
      "src/app/dashboard/school-leader/page.tsx",
      "src/app/dashboard/school-leader/layout.tsx",
      "src/app/dashboard/school-leader/enrollment/page.tsx",
      "src/app/dashboard/school-leader/students/page.tsx",
      "src/app/dashboard/school-leader/teachers/page.tsx",
      "src/app/dashboard/school-leader/academics/page.tsx",
      "src/app/dashboard/school-leader/scheduling/page.tsx",
      "src/app/dashboard/school-leader/compliance/page.tsx",
      "src/app/dashboard/school-leader/finance/page.tsx",
      "src/app/dashboard/school-leader/hr/page.tsx",
      "src/app/dashboard/school-leader/communications/page.tsx",
      "src/app/dashboard/school-leader/reports/page.tsx",
      "src/app/dashboard/school-leader/profile/page.tsx",
      "src/lib/school-leader/experience/orchestrator.ts",
      "src/lib/school-leader/experience/summaries.ts",
      "docs/academyos/portal/04_SCHOOL_LEADER_EXPERIENCE.md",
    ];
    for (const rel of required) {
      expect(existsSync(join(root, rel)), rel).toBe(true);
    }
    expect(
      SCHOOL_LEADER_EXPERIENCE_NAV.some((n) => n.href === "/dashboard/school-leader/finance")
    ).toBe(true);
    expect(SCHOOL_LEADER_QUICK_ACTIONS.length).toBeGreaterThan(3);
    const catalog = readFileSync(
      join(root, "docs/platform/consolidation/02_FRONTEND_SCREEN_CATALOG.md"),
      "utf8"
    );
    expect(catalog).toContain("/dashboard/school-leader");
    expect(catalog).toContain("School Leader Workspace");
  });

  it("publishes Twin, Evidence, and Memory for meaningful actions", () => {
    const org = "org-school-leader-wave15";
    publishSchoolLeaderExperienceEvent({
      type: "school_leader.dashboard_viewed",
      organizationId: org,
      recordType: "campus",
      recordId: "school-1",
      projectLive: false,
    });
    publishSchoolLeaderExperienceEvent({
      type: "school_leader.finance_reviewed",
      organizationId: org,
      recordType: "campus",
      recordId: "school-1",
      projectLive: false,
    });
    expect(listSchoolLeaderExperienceEvents(org).length).toBe(2);
    expect(listSchoolLeaderExperienceTwin(org).length).toBe(2);
    expect(listSchoolLeaderExperienceEvidence(org).length).toBe(2);
    expect(listSchoolLeaderExperienceMemory(org).length).toBe(2);
  });

  it("finance summary path is read-only (no accounting duplication flags)", () => {
    const summariesSrc = readFileSync(
      join(root, "src/lib/school-leader/experience/summaries.ts"),
      "utf8"
    );
    expect(summariesSrc).toContain("getFinanceOperationsSummary");
    expect(summariesSrc).toContain("readOnly: true");
    expect(summariesSrc).toContain("no accounting or payroll logic");
    expect(summariesSrc).toContain("LearningIntelligenceEngine");
  });

  it("orchestrator exposes campus methods without inventing engines", () => {
    const orch = createSchoolLeaderExperienceOrchestrator();
    expect(orch.guards.createsPlatformEngines).toBe(false);
    expect(typeof orch.publishDashboardViewed).toBe("function");
    expect(typeof orch.getEnrollment).toBe("function");
    expect(typeof orch.getFinance).toBe("function");
    expect(typeof orch.getReportsCatalog).toBe("function");
  });

  it("regression: existing domain dashboards remain linked", () => {
    expect(existsSync(join(root, "src/app/dashboard/students"))).toBe(true);
    expect(existsSync(join(root, "src/app/dashboard/admissions"))).toBe(true);
    expect(existsSync(join(root, "src/app/dashboard/scheduling"))).toBe(true);
    expect(existsSync(join(root, "src/app/dashboard/finance"))).toBe(true);
    expect(existsSync(join(root, "src/app/dashboard/hr"))).toBe(true);
  });
});
