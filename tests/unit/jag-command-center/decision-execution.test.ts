import { describe, expect, it, beforeEach } from "vitest";
import { SCHOOL_HEALTH_ACTION_PROPOSAL_IDS as PROPOSAL_IDS } from "@/lib/domains/education";
import {
  addExecutionUpdate,
  assignDecision,
  getDecisionCenterDetail,
  loadDecisionCenter,
  loadExecutiveOverview,
  recordDecisionFeedback,
  recordDecisionOutcome,
  recordSchoolHealthResult,
  resetDecisionCatalogCacheForTests,
  resetDecisionExecutionStoreForTests,
  resetDecisionStatusStoreForTests,
  resetJagIntelligenceStoreForTests,
} from "@/lib/jag-command-center";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

const session: JagPlatformSession = {
  userId: "jag-user-founder",
  email: "founder@jag.platform",
  displayName: "JAG Founder",
  role: "FOUNDER",
  issuedAt: "2026-01-01T00:00:00.000Z",
};

function bindProposal(orgId: string) {
  recordSchoolHealthResult({
    organizationId: orgId,
    result: {
      subjectId: orgId,
      evidence: [
        {
          source: "education.school_health",
          id: "ev-exec",
          retrievedAt: "2026-07-29T12:00:00.000Z",
          attributes: { code: "health_watch", summary: "watch" },
        },
      ],
      recommendations: [
        {
          id: "rec-exec",
          kind: "stabilize_organizational_health",
          title: "Stabilize",
          explanation: "x",
          confidence: 0.9,
          priority: 1,
          evidenceIds: [],
          suggestedActions: [
            {
              kind: "EscalateOrganizationalRisk",
              actionId: PROPOSAL_IDS.EscalateOrganizationalRisk,
              label: "Escalate Organizational Risk",
              priority: 1,
              rationale: "Escalate risk for network health",
            },
          ],
          constitutionalTrace: {
            domainPackageId: "education",
            contributorId: "education.cognition.school_health",
            laws: [],
            rationale: "t",
          },
        },
      ],
      confidence: 0.9,
      explanation: "x",
      priority: 1,
      blockingIssues: [],
      warnings: [],
      suggestedActions: [],
      readiness: "conditional",
      analyzedAt: "2026-07-29T15:00:00.000Z",
    },
  });
}

describe("Decision Execution (JAG-004)", () => {
  beforeEach(() => {
    resetJagIntelligenceStoreForTests();
    resetDecisionStatusStoreForTests();
    resetDecisionExecutionStoreForTests();
    resetDecisionCatalogCacheForTests();
  });

  it("supports assign → progress → complete → outcome review", () => {
    const orgId =
      loadDecisionCenter(session).filterOptions.organizations[0]?.id ??
      "org-exec";
    bindProposal(orgId);

    const model = loadDecisionCenter(session);
    expect(model.counts.total).toBeGreaterThanOrEqual(1);
    const decision = model.decisions[0]!;

    assignDecision({
      decisionId: decision.id,
      actor: "tester",
      targetType: "role",
      role: "ORG_OWNER",
      priority: "P1",
      dueDate: "2099-01-01",
    });

    addExecutionUpdate({
      decisionId: decision.id,
      actor: "tester",
      kind: "started",
      message: "Kickoff with campus leads",
    });

    addExecutionUpdate({
      decisionId: decision.id,
      actor: "tester",
      kind: "progress",
      message: "Mitigation plan drafted",
      progressPct: 40,
    });

    addExecutionUpdate({
      decisionId: decision.id,
      actor: "tester",
      kind: "completed",
      message: "Mitigation complete",
      progressPct: 100,
    });

    recordDecisionOutcome({
      decisionId: decision.id,
      actor: "tester",
      expectedOutcome: "Risk contained",
      actualOutcome: "Risk contained within SLA",
      confidence: 0.85,
      result: "success",
      lessonsLearned: "Escalate earlier next cycle",
    });

    recordDecisionFeedback({
      decisionId: decision.id,
      actor: "tester",
      achievedIntendedResult: true,
      futurePriority: "higher",
      notes: "Prioritize similar health escalations",
    });

    const detail = getDecisionCenterDetail(session, decision.id);
    expect(detail).not.toBeNull();
    expect(detail!.card.status).toBe("Outcome Reviewed");
    expect(detail!.assignment?.role).toBe("ORG_OWNER");
    expect(detail!.executionHistory.length).toBeGreaterThanOrEqual(4);
    expect(detail!.outcome?.result).toBe("success");
    expect(detail!.feedback?.futurePriority).toBe("higher");

    const metrics = loadDecisionCenter(session).metrics;
    expect(metrics.outcomeSuccessRate).toBe(1);
    expect(metrics.completedThisWeek).toBeGreaterThanOrEqual(1);

    const overview = loadExecutiveOverview(session);
    expect(overview.decisionExecution.outcomeSuccessRate).toBe(1);
    expect(overview.decisionExecution.assigned).toBeGreaterThanOrEqual(0);
  });

  it("flags overdue assigned decisions", () => {
    const orgId =
      loadDecisionCenter(session).filterOptions.organizations[0]?.id ??
      "org-overdue";
    bindProposal(orgId);
    const decision = loadDecisionCenter(session).decisions[0]!;

    assignDecision({
      decisionId: decision.id,
      actor: "tester",
      targetType: "organization",
      organizationId: orgId,
      organizationName: "Test Org",
      priority: "P1",
      dueDate: "2020-01-01",
    });

    const after = loadDecisionCenter(session);
    const card = after.decisions.find((d) => d.id === decision.id)!;
    expect(card.isOverdue).toBe(true);
    expect(after.metrics.overdue).toBeGreaterThanOrEqual(1);
  });
});
