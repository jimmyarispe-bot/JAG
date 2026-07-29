import { describe, expect, it, beforeEach } from "vitest";
import {
  loadExecutiveOverview,
  recordSchoolHealthResult,
  recordExecutiveBriefResult,
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

describe("Executive Overview (JAG-002)", () => {
  beforeEach(() => {
    resetJagIntelligenceStoreForTests();
  });

  it("loads capability packs and education domain without fabricating health", () => {
    const model = loadExecutiveOverview(session);

    expect(model.capabilityPacks.length).toBeGreaterThanOrEqual(5);
    expect(model.domains.some((d) => d.id === "education")).toBe(true);
    expect(model.organizationHealth.status).toBe("empty");
    expect(model.decisionExecution.openDecisions).toBe(0);
    expect(model.decisionExecution.outcomeSuccessRate).toBeNull();
    expect(model.decisionExecution.href).toBe("/jag/decisions");
    expect(model.organizationHealth.explanation.toLowerCase()).toContain(
      "school health"
    );
    expect(model.executiveBrief.status).toBe("empty");
    expect(model.executiveBrief.explanation.toLowerCase()).toContain("brief");
    expect(model.runtimeStatus.map((s) => s.id)).toEqual(
      expect.arrayContaining([
        "planner",
        "graph",
        "policy-engine",
        "knowledge-model",
        "observability",
      ])
    );
    expect(
      model.runtimeStatus.find((s) => s.id === "planner")?.health
    ).toBe("healthy");
    expect(
      model.runtimeStatus.find((s) => s.id === "observability")?.health
    ).toBe("unavailable");
  });

  it("surfaces bound school health and executive brief when recorded", () => {
    const orgId =
      loadExecutiveOverview(session).organizationId ?? "org-test";

    recordSchoolHealthResult({
      organizationId: orgId,
      result: {
        subjectId: orgId,
        stance: "watch",
        healthScore: 0.62,
        evidence: [],
        recommendations: [
          {
            id: "r1",
            kind: "stabilize_organizational_health",
            title: "Stabilize Organizational Health",
            explanation: "ops",
            confidence: 0.9,
            priority: 1,
            evidenceIds: [],
            suggestedActions: [],
            constitutionalTrace: {
              domainPackageId: "education",
              contributorId: "education.cognition.school_health",
              laws: [],
              rationale: "test",
            },
          },
        ],
        confidence: 0.88,
        explanation: "Conditional school health from upstream warnings.",
        priority: 2,
        blockingIssues: [],
        warnings: ["Operational readiness concerns"],
        suggestedActions: [],
        readiness: "conditional",
        analyzedAt: "2026-07-29T12:00:00.000Z",
      },
    });

    recordExecutiveBriefResult({
      organizationId: orgId,
      result: {
        subjectId: orgId,
        stance: "cautionary",
        briefingConfidence: 0.84,
        evidence: [
          {
            source: "education.executive_briefing",
            id: "e1",
            retrievedAt: "2026-07-29T12:00:00.000Z",
            attributes: {
              code: "executive_summary",
              summary: "Executive stance is cautionary.",
            },
          },
        ],
        recommendations: [
          {
            id: "b1",
            kind: "publish_executive_brief",
            title: "Publish Executive Education Brief",
            explanation: "x",
            confidence: 0.9,
            priority: 1,
            evidenceIds: [],
            suggestedActions: [],
            constitutionalTrace: {
              domainPackageId: "education",
              contributorId: "education.cognition.executive_briefing",
              laws: [],
              rationale: "test",
            },
          },
        ],
        confidence: 0.84,
        explanation: "Top-level synthesis complete.",
        priority: 1,
        blockingIssues: [],
        warnings: [],
        suggestedActions: [],
        readiness: "conditional",
        analyzedAt: "2026-07-29T12:05:00.000Z",
      },
    });

    const model = loadExecutiveOverview(session, { organizationId: orgId });
    expect(model.organizationHealth.status).toBe("ready");
    expect(model.organizationHealth.overallHealth).toBe("watch");
    expect(model.organizationHealth.riskLevel).toBe("Elevated");
    expect(model.organizationHealth.confidence).toBe(0.88);
    expect(model.executiveBrief.status).toBe("ready");
    expect(model.executiveBrief.summary).toContain("cautionary");
    expect(model.recentIntelligence.length).toBeGreaterThan(0);
    expect(
      model.runtimeStatus.find((s) => s.id === "observability")?.health
    ).toBe("healthy");
  });

  it("exposes pack version and dependency metadata", () => {
    const model = loadExecutiveOverview(session);
    const executive = model.capabilityPacks.find((p) =>
      p.id.includes("executive_intelligence")
    );
    expect(executive).toBeTruthy();
    expect(executive?.version).toBe("0.1.0");
    expect(executive?.contributorCount).toBe(3);
    expect(executive?.dependencies.length).toBeGreaterThan(0);
  });
});
