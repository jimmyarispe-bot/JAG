import { beforeEach, describe, expect, it } from "vitest";
import {
  attachPredictedConsequences,
  loadExecutiveOverview,
  loadForecastsView,
  recordSchoolHealthResult,
  resetJagIntelligenceStoreForTests,
  synthesizeExecutiveBriefing,
} from "@/lib/jag-command-center";
import { clearPredictionObservationsForTests } from "@/lib/platform/intelligence/predictive";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import type { JagDecisionCard } from "@/lib/jag-command-center/decision-center/types";

const session: JagPlatformSession = {
  userId: "jag-user-founder",
  email: "founder@jag.platform",
  displayName: "JAG Founder",
  role: "FOUNDER",
  issuedAt: "2026-01-01T00:00:00.000Z",
};

function bindHealth(organizationId: string) {
  recordSchoolHealthResult({
    organizationId,
    result: {
      subjectId: organizationId,
      stance: "watch",
      healthScore: 0.62,
      evidence: [
        {
          source: "education.school_health",
          id: "ev-1",
          retrievedAt: "2026-07-21T12:00:00.000Z",
          attributes: {
            code: "health_watch",
            summary: "Watch posture",
          },
        },
      ],
      recommendations: [
        {
          id: "rec-1",
          kind: "stabilize_organizational_health",
          title: "Stabilize Organizational Health",
          explanation: "Upstream risk",
          confidence: 0.9,
          priority: 1,
          evidenceIds: ["ev-1"],
          suggestedActions: [
            {
              kind: "EscalateOrganizationalRisk",
              actionId: "escalate_organizational_risk",
              label: "Escalate Organizational Risk",
              priority: 1,
              rationale: "Propose escalating organizational health risk",
            },
          ],
          constitutionalTrace: {
            domainPackageId: "education",
            contributorId: "education.cognition.school_health",
            laws: ["law.evidence"],
            rationale: "test",
          },
        },
      ],
      confidence: 0.88,
      explanation: "Conditional school health with ops pressure.",
      priority: 2,
      blockingIssues: [],
      warnings: ["ops"],
      suggestedActions: [],
      readiness: "conditional",
      analyzedAt: "2026-07-21T12:00:00.000Z",
    },
  });
}

describe("Command Center predictive forecasts (Sprint 201)", () => {
  beforeEach(() => {
    resetJagIntelligenceStoreForTests();
    clearPredictionObservationsForTests();
  });

  it("loads empty forecasts until contributor signals exist", () => {
    const view = loadForecastsView(session);
    expect(view.status).toBe("empty");
    expect(view.advisoryNotice.toLowerCase()).toContain("advisory");
  });

  it("produces overview forecast cards from bound school health", () => {
    const overview = loadExecutiveOverview(session);
    const orgId = overview.organizationId ?? "org-forecast-test";
    bindHealth(orgId);

    const view = loadForecastsView(session, { organizationId: orgId });
    expect(view.status).toBe("ready");
    expect(view.cards.length).toBe(8);
    expect(view.cards.some((c) => c.title === "Organization Health")).toBe(
      true
    );
    expect(view.observationId).toBeTruthy();
    expect(view.advisoryNotice.toLowerCase()).toContain("advisory");

    const model = loadExecutiveOverview(session, { organizationId: orgId });
    expect(model.forecasts.status).toBe("ready");
    expect(model.forecasts.cards.length).toBeGreaterThan(0);
  });

  it("attaches predicted consequence to open decision cards", () => {
    const card = {
      id: "d1",
      title: "Resolve schedule gap",
      category: "operations",
      categoryLabel: "Operations",
      organizationId: "org-1",
      organizationName: "Academy",
      domainId: "education",
      domainName: "Education",
      capabilityPackId: "pack",
      capabilityPackName: "Pack",
      contributorId: "education.cognition.operational_readiness",
      contributorLabel: "Ops",
      priority: "P1",
      priorityRank: 1,
      confidence: 0.7,
      evidenceCount: 1,
      recommendedAction: "Close gap",
      status: "New",
      actionId: "a1",
      actionKind: "operational",
      executionId: "e1",
      analyzedAt: "2026-07-21T10:00:00.000Z",
      rationale: "Blocks readiness",
      assignment: null,
      isOverdue: false,
      outcomeResult: null,
    } satisfies JagDecisionCard;

    bindHealth("org-1");
    const [enriched] = attachPredictedConsequences([card]);
    expect(enriched?.predictedConsequence?.statement.toLowerCase()).toContain(
      "remains open"
    );
    expect(
      enriched?.predictedConsequence?.advisoryNotice.toLowerCase()
    ).toContain("advisory");
  });

  it("includes Forecast section in synthesized briefings", () => {
    const overview = loadExecutiveOverview(session);
    const orgId = overview.organizationId ?? "org-brief-forecast";
    bindHealth(orgId);

    const briefing = synthesizeExecutiveBriefing({
      session,
      organizationId: orgId,
      kind: "weekly_executive_review",
      timeline: "this_week",
      generatedBy: "test",
    });

    expect("error" in briefing).toBe(false);
    if ("error" in briefing) return;
    const forecast = briefing.sections.find((s) => s.id === "forecast");
    expect(forecast).toBeDefined();
    expect(forecast?.title).toBe("Forecast");
    expect(forecast?.narrative.toLowerCase()).toMatch(/likely|advisory|forecast/);
  });
});
