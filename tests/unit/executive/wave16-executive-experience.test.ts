import { describe, expect, it, beforeEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EXECUTIVE_EXPERIENCE_ENGINES,
  EXECUTIVE_EXPERIENCE_GUARDS,
  EXECUTIVE_EXPERIENCE_NAV,
  EXECUTIVE_QUICK_ACTIONS,
  createExecutiveExperienceOrchestrator,
  listExecutiveExperienceEvents,
  listExecutiveExperienceEvidence,
  listExecutiveExperienceMemory,
  listExecutiveExperienceTwin,
  publishExecutiveExperienceEvent,
  resetExecutiveExperienceOpsForTests,
} from "@/lib/executive/experience";

const root = process.cwd();

describe("Wave 1.6 Executive Workspace", () => {
  beforeEach(() => {
    resetExecutiveExperienceOpsForTests();
  });

  it("is product orchestration with platform guards", () => {
    expect(EXECUTIVE_EXPERIENCE_GUARDS.productExperienceOnly).toBe(true);
    expect(EXECUTIVE_EXPERIENCE_GUARDS.createsPlatformEngines).toBe(false);
    expect(EXECUTIVE_EXPERIENCE_GUARDS.duplicatesBusinessLogic).toBe(false);
    expect(EXECUTIVE_EXPERIENCE_GUARDS.duplicatesFinance).toBe(false);
    expect(EXECUTIVE_EXPERIENCE_GUARDS.duplicatesLearningIntelligence).toBe(false);
    expect(EXECUTIVE_EXPERIENCE_GUARDS.duplicatesKnowledge).toBe(false);
    expect(EXECUTIVE_EXPERIENCE_GUARDS.duplicatesReporting).toBe(false);
    expect(EXECUTIVE_EXPERIENCE_GUARDS.duplicatesStrategyLogic).toBe(false);
    expect(EXECUTIVE_EXPERIENCE_GUARDS.financeReadOnlySummaries).toBe(true);
    expect(EXECUTIVE_EXPERIENCE_GUARDS.noSpeculativeAi).toBe(true);
    expect(EXECUTIVE_EXPERIENCE_ENGINES).toContain("FinanceEngine");
    expect(EXECUTIVE_EXPERIENCE_ENGINES).toContain("ChiefFinancialOfficerEngine");
    expect(EXECUTIVE_EXPERIENCE_ENGINES).toContain("InnovationEngine");
    expect(EXECUTIVE_EXPERIENCE_ENGINES).toContain("StrategyEngine");
  });

  it("ships Wave 1.6 executive routes and docs", () => {
    const required = [
      "src/app/dashboard/executive/page.tsx",
      "src/app/dashboard/executive/layout.tsx",
      "src/app/dashboard/executive/multi-school/page.tsx",
      "src/app/dashboard/executive/academics/page.tsx",
      "src/app/dashboard/executive/operations/page.tsx",
      "src/app/dashboard/executive/finance/page.tsx",
      "src/app/dashboard/executive/people/page.tsx",
      "src/app/dashboard/executive/strategy/page.tsx",
      "src/app/dashboard/executive/innovation/page.tsx",
      "src/app/dashboard/executive/intelligence/page.tsx",
      "src/app/dashboard/executive/reports/page.tsx",
      "src/app/dashboard/executive/communications/page.tsx",
      "src/app/dashboard/executive/profile/page.tsx",
      "src/lib/executive/experience/orchestrator.ts",
      "src/lib/executive/experience/summaries.ts",
      "docs/academyos/portal/05_EXECUTIVE_EXPERIENCE.md",
    ];
    for (const rel of required) {
      expect(existsSync(join(root, rel)), rel).toBe(true);
    }
    expect(
      EXECUTIVE_EXPERIENCE_NAV.some((n) => n.href === "/dashboard/executive/innovation")
    ).toBe(true);
    expect(EXECUTIVE_QUICK_ACTIONS.length).toBeGreaterThan(3);
    const catalog = readFileSync(
      join(root, "docs/platform/consolidation/02_FRONTEND_SCREEN_CATALOG.md"),
      "utf8"
    );
    expect(catalog).toContain("/dashboard/executive/multi-school");
    expect(catalog).toContain("Executive Workspace");
  });

  it("publishes Twin, Evidence, and Memory for meaningful actions", () => {
    const org = "org-executive-wave16";
    publishExecutiveExperienceEvent({
      type: "executive.dashboard_viewed",
      organizationId: org,
      recordType: "organization",
      recordId: "org-1",
      projectLive: false,
    });
    publishExecutiveExperienceEvent({
      type: "executive.finance_reviewed",
      organizationId: org,
      recordType: "organization",
      recordId: "org-1",
      projectLive: false,
    });
    expect(listExecutiveExperienceEvents(org).length).toBe(2);
    expect(listExecutiveExperienceTwin(org).length).toBe(2);
    expect(listExecutiveExperienceEvidence(org).length).toBe(2);
    expect(listExecutiveExperienceMemory(org).length).toBe(2);
  });

  it("finance and strategy paths are orchestration-only", () => {
    const summariesSrc = readFileSync(
      join(root, "src/lib/executive/experience/summaries.ts"),
      "utf8"
    );
    expect(summariesSrc).toContain("getFinanceOperationsSummary");
    expect(summariesSrc).toContain("readOnly: true");
    expect(summariesSrc).toContain("createInnovationEngine");
    expect(summariesSrc).toContain("describeStrategyChain");
    expect(summariesSrc).toContain("no accounting logic");
  });

  it("orchestrator exposes executive methods without inventing engines", () => {
    const orch = createExecutiveExperienceOrchestrator();
    expect(orch.guards.createsPlatformEngines).toBe(false);
    expect(typeof orch.publishDashboardViewed).toBe("function");
    expect(typeof orch.getMultiSchool).toBe("function");
    expect(typeof orch.getFinance).toBe("function");
    expect(typeof orch.getInnovation).toBe("function");
    expect(typeof orch.getReportsCatalog).toBe("function");
  });

  it("regression: existing executive intelligence routes remain", () => {
    expect(existsSync(join(root, "src/app/dashboard/executive/board/page.tsx"))).toBe(true);
    expect(existsSync(join(root, "src/app/dashboard/executive/kpis/page.tsx"))).toBe(true);
    expect(existsSync(join(root, "src/app/dashboard/executive/strategic/page.tsx"))).toBe(true);
    expect(existsSync(join(root, "src/app/dashboard/executive/network/page.tsx"))).toBe(true);
  });
});
