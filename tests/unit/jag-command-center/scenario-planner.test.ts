import { beforeEach, describe, expect, it } from "vitest";
import {
  getDecisionCenterDetail,
  loadDecisionCenter,
  loadScenarioPlanner,
  recordSchoolHealthResult,
  resetDecisionCatalogCacheForTests,
  resetDecisionExecutionStoreForTests,
  resetDecisionStatusStoreForTests,
  resetJagIntelligenceStoreForTests,
  synthesizeExecutiveBriefing,
} from "@/lib/jag-command-center";
import { SCHOOL_HEALTH_ACTION_PROPOSAL_IDS as PROPOSAL_IDS } from "@/lib/domains/education";
import { clearScenarioObservationsForTests } from "@/lib/platform/intelligence/scenarios";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

const session: JagPlatformSession = {
  userId: "jag-user-founder",
  email: "founder@jag.platform",
  displayName: "JAG Founder",
  role: "FOUNDER",
  issuedAt: "2026-01-01T00:00:00.000Z",
};

function bind(organizationId: string) {
  recordSchoolHealthResult({
    organizationId,
    result: {
      subjectId: organizationId,
      stance: "watch",
      healthScore: 0.6,
      evidence: [],
      recommendations: [
        {
          id: "rec-1",
          kind: "stabilize_organizational_health",
          title: "Stabilize",
          explanation: "test",
          confidence: 0.9,
          priority: 1,
          evidenceIds: [],
          suggestedActions: [
            {
              kind: "EscalateOrganizationalRisk",
              actionId: PROPOSAL_IDS.EscalateOrganizationalRisk,
              label: "Escalate Organizational Risk",
              priority: 1,
              rationale: "Escalate",
            },
          ],
          constitutionalTrace: {
            domainPackageId: "education",
            contributorId: "education.cognition.school_health",
            laws: [],
            rationale: "test",
          },
        },
      ],
      confidence: 0.85,
      explanation: "Watch",
      priority: 2,
      blockingIssues: [],
      warnings: [],
      suggestedActions: [],
      readiness: "conditional",
      analyzedAt: "2026-07-21T12:00:00.000Z",
    },
  });
}

describe("Scenario Planner Command Center (Sprint 202)", () => {
  beforeEach(() => {
    resetJagIntelligenceStoreForTests();
    resetDecisionStatusStoreForTests();
    resetDecisionExecutionStoreForTests();
    resetDecisionCatalogCacheForTests();
    clearScenarioObservationsForTests();
  });

  it("loads templates without running until kinds selected", () => {
    const model = loadScenarioPlanner(session);
    expect(model.templates.length).toBe(11);
    expect(model.results).toEqual([]);
    expect(model.advisoryNotice.toLowerCase()).toContain("advisory");
  });

  it("runs and compares selected scenarios", () => {
    const idle = loadScenarioPlanner(session);
    const orgId = idle.organizationId ?? "org-scn";
    bind(orgId);

    const model = loadScenarioPlanner(session, {
      organizationId: orgId,
      runKinds: ["teacher_hiring", "enrollment_decline"],
      compare: true,
    });

    expect(model.results.length).toBe(2);
    expect(model.comparison).not.toBeNull();
    expect(model.comparison!.rows.some((r) => r.title === "Current")).toBe(
      true
    );
    expect(model.observationId).toBeTruthy();
  });

  it("attaches approve/defer/reject what-if on decision detail", () => {
    const idle = loadScenarioPlanner(session);
    const orgId = idle.organizationId ?? "org-scn-d";
    bind(orgId);

    const center = loadDecisionCenter(session, { organizationId: orgId });
    const first = center.decisions[0];
    expect(first).toBeDefined();
    const detail = getDecisionCenterDetail(session, first!.id);
    expect(detail?.scenarioWhatIf.approve?.statement.toLowerCase()).toContain(
      "approve"
    );
    expect(detail?.scenarioWhatIf.defer?.statement.toLowerCase()).toContain(
      "defer"
    );
    expect(detail?.scenarioWhatIf.reject?.statement.toLowerCase()).toContain(
      "reject"
    );
  });

  it("includes Scenario Analysis in briefings", () => {
    const idle = loadScenarioPlanner(session);
    const orgId = idle.organizationId ?? "org-scn-b";
    bind(orgId);

    const briefing = synthesizeExecutiveBriefing({
      session,
      organizationId: orgId,
      kind: "weekly_executive_review",
      timeline: "this_week",
      generatedBy: "test",
    });
    expect("error" in briefing).toBe(false);
    if ("error" in briefing) return;
    const section = briefing.sections.find((s) => s.id === "scenario_analysis");
    expect(section?.title).toBe("Scenario Analysis");
    expect(section?.bullets.some((b) => /favorable|risk|confidence/i.test(b))).toBe(
      true
    );
  });
});
