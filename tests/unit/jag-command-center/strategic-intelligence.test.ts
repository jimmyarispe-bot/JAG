/**
 * Sprint 205 — Command Center Strategic Intelligence wiring.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadBriefingList,
  loadDecisionCenter,
  getDecisionCenterDetail,
  loadScenarioPlanner,
  loadStrategyWorkspace,
  recordSchoolHealthResult,
  resetBriefingStoreForTests,
  resetDecisionCatalogCacheForTests,
  resetDecisionExecutionStoreForTests,
  resetDecisionStatusStoreForTests,
  resetJagIntelligenceStoreForTests,
  routeConversationIntent,
  synthesizeExecutiveBriefing,
} from "@/lib/jag-command-center";
import { SCHOOL_HEALTH_ACTION_PROPOSAL_IDS as PROPOSAL_IDS } from "@/lib/domains/education";
import {
  clearStrategyObservationsForTests,
  resetStrategyServiceForTests,
} from "@/lib/platform/intelligence/strategy/index";
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

describe("Strategic Intelligence Command Center (Sprint 205)", () => {
  beforeEach(() => {
    resetJagIntelligenceStoreForTests();
    resetDecisionStatusStoreForTests();
    resetDecisionExecutionStoreForTests();
    resetDecisionCatalogCacheForTests();
    resetBriefingStoreForTests();
    clearScenarioObservationsForTests();
    resetStrategyServiceForTests();
    clearStrategyObservationsForTests();
  });

  afterEach(() => {
    resetStrategyServiceForTests();
    clearStrategyObservationsForTests();
  });

  it("loads strategy workspace with mission and goal health", () => {
    const model = loadStrategyWorkspace(session);
    expect(model.organizationId).toBeTruthy();
    bind(model.organizationId!);
    const loaded = loadStrategyWorkspace(session, {
      organizationId: model.organizationId!,
    });
    expect(loaded.bundle?.mission).toBeTruthy();
    expect(loaded.bundle?.goals.length).toBeGreaterThan(0);
    expect(loaded.bundle?.scorecard.alignmentScore).toBeGreaterThan(0);
  });

  it("includes Strategic Alignment in briefings", () => {
    const orgId =
      loadBriefingList(session).selectedOrganizationId ??
      loadStrategyWorkspace(session).organizationId!;
    bind(orgId);

    const result = synthesizeExecutiveBriefing({
      session,
      organizationId: orgId,
      scope: "single",
      kind: "morning_brief",
      timeline: "this_week",
      generatedBy: "tester",
    });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.sections.some((s) => s.id === "strategic_alignment")).toBe(
      true
    );
  });

  it("attaches strategic alignment on decision detail", () => {
    const orgId =
      loadStrategyWorkspace(session).organizationId ?? "org-strategy-1";
    bind(orgId);
    const after = loadDecisionCenter(session);
    const card = after.decisions[0];
    expect(card).toBeTruthy();
    const detail = getDecisionCenterDetail(session, card!.id);
    expect(detail?.strategicAlignment).toBeTruthy();
    expect(detail!.strategicAlignment!.missionAlignment).toBeGreaterThan(0);
  });

  it("reports strategic impact from scenario planner", () => {
    const idle = loadScenarioPlanner(session);
    const orgId = idle.organizationId!;
    bind(orgId);
    const model = loadScenarioPlanner(session, {
      organizationId: orgId,
      runKinds: ["teacher_hiring"],
    });
    expect(model.strategicImpact).toBeTruthy();
    expect(model.strategicImpact!.goalImpact).toBeTruthy();
    expect(model.strategicImpact!.missionImpact).toMatch(/mission/i);
  });

  it("routes strategy conversation intents", () => {
    expect(
      routeConversationIntent("Are we accomplishing our mission?").intent
    ).toBe("strategic_alignment");
    expect(
      routeConversationIntent("Which goals are most at risk?").intent
    ).toBe("strategic_alignment");
    expect(
      routeConversationIntent("Which initiatives drive the most impact?").intent
    ).toBe("strategic_alignment");
    expect(
      routeConversationIntent("How are we progressing this quarter?").intent
    ).toBe("strategic_alignment");
  });
});
