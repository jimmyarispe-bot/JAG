/**
 * Executive Decision Intelligence — unit tests (Sprint 026).
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  createExecutiveDecisionIntelligence,
  createPresetScenario,
  type ExecutiveDecisionRequest,
} from "@/lib/platform/intelligence/executive-decision";
import { resetGraphEdgeSeqForTests } from "@/lib/platform/intelligence/executive-graph";
import { createIntelligenceService } from "@/lib/platform/intelligence";

function graphInput() {
  return {
    scope: { organizationId: "org-1", schoolId: "school-1" },
    builtAt: "2026-07-12T12:00:00.000Z",
    executive: {
      enrollment: 120,
      admissions: 18,
      revenue: 54000,
      outstanding: 12000,
      staff: 42,
      studentAttendance: 91,
      teacherAttendance: 96,
    },
    organizationHealth: {
      overallScore: 78,
      enrollmentScore: 72,
      financialScore: 81,
      workforceScore: 70,
      operationsScore: 75,
      complianceScore: 88,
      academicScore: 80,
    },
    founder: {
      healthScore: 78,
      healthStatus: "warning",
      priorities: [
        {
          id: "collections",
          title: "Improve collections",
          severity: "high",
          confidence: 0.85,
        },
      ],
      risks: [
        {
          id: "cash-risk",
          title: "Cash pressure",
          severity: "high",
          probability: 0.7,
          impact: 0.8,
        },
      ],
      opportunities: [
        {
          id: "pipeline",
          title: "Expand admissions outreach",
          estimatedValue: 25000,
          confidence: 0.7,
        },
      ],
    },
  };
}

function makeRequest(
  scenarios: ExecutiveDecisionRequest["scenarios"]
): ExecutiveDecisionRequest {
  return {
    requestId: "dec-test-1",
    question: "Which strategic moves should we simulate?",
    scenarios,
    graphInput: graphInput(),
    scope: { organizationId: "org-1", schoolId: "school-1" },
    maxRecommendations: 6,
    horizonMonths: 12,
  };
}

describe("Executive Decision Intelligence (Sprint 026)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
  });

  it("simulates enrollment drop and returns full recommendations", () => {
    const { service } = createExecutiveDecisionIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
    });

    const result = service.evaluate(
      makeRequest([createPresetScenario("enrollment_drop", { magnitude: 0.1 })])
    );

    expect(result.simulations).toHaveLength(1);
    const forecast = result.simulations[0]!.forecast;
    expect(forecast.projected.enrollment).toBeLessThan(forecast.baseline.enrollment);
    expect(forecast.financial.revenueDelta).toBeLessThan(0);

    const rec = result.recommendations[0];
    expect(rec).toBeTruthy();
    expect(rec!.executiveSummary.length).toBeGreaterThan(0);
    expect(rec!.supportingEvidence.length).toBeGreaterThan(0);
    expect(rec!.financialImpact).toBeTruthy();
    expect(rec!.operationalImpact).toBeTruthy();
    expect(rec!.missionImpact).toBeTruthy();
    expect(rec!.risks.length).toBeGreaterThan(0);
    expect(rec!.confidenceScore.value).toBeGreaterThan(0);
    expect(result.projection.headline.length).toBeGreaterThan(0);
    expect(result.historyRecord.status).toBe("recommended");
  });

  it("simulates payroll increase pressure", () => {
    const { service } = createExecutiveDecisionIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
    });

    const result = service.evaluate(
      makeRequest([createPresetScenario("payroll_increase", { magnitude: 0.08 })])
    );

    const forecast = result.simulations[0]!.forecast;
    expect(forecast.projected.payroll).toBeGreaterThan(forecast.baseline.payroll);
    expect(forecast.financial.costDelta).toBeGreaterThan(0);
  });

  it("compares hiring now vs later", () => {
    const { service } = createExecutiveDecisionIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
    });

    const result = service.evaluate(makeRequest([createPresetScenario("hiring_timing")]));
    const simulation = result.simulations[0]!;
    expect(simulation.tradeoffs).toBeTruthy();
    expect(simulation.tradeoffs!.preferredOption.length).toBeGreaterThan(0);
    expect(result.recommendations.some((r) => r.timing)).toBe(true);
  });

  it("ranks strategic initiatives by composite ROI", () => {
    const { service } = createExecutiveDecisionIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
    });

    const result = service.evaluate(
      makeRequest([createPresetScenario("strategic_initiative")])
    );
    const strategy = result.simulations[0]!.strategy;
    expect(strategy).toBeTruthy();
    expect(strategy!.rankings.length).toBeGreaterThanOrEqual(3);
    expect(strategy!.recommendedInitiativeId).toBeTruthy();
    expect(strategy!.rankings[0]!.rank).toBe(1);
  });

  it("supports decision queries and history", () => {
    const { service } = createExecutiveDecisionIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
    });

    const result = service.evaluate(
      makeRequest([
        createPresetScenario("enrollment_drop"),
        createPresetScenario("strategic_initiative"),
      ])
    );

    const answer = service.query(result, {
      question: "Which initiative has the highest ROI?",
      focus: "roi",
    });
    expect(answer.answer.length).toBeGreaterThan(0);
    expect(service.history().list().length).toBeGreaterThan(0);
    expect(service.scenarios().list().length).toBeGreaterThan(0);
  });

  it("wires through createIntelligenceService", () => {
    const intelligence = createIntelligenceService({
      executiveDecisionOptions: {
        createId: (prefix) => `${prefix}-svc`,
        now: () => new Date("2026-07-12T15:00:00.000Z"),
      },
    });

    expect(intelligence.executiveDecision.service).toBeTruthy();
    expect(intelligence.executiveGraphAnalyzer).toBeTruthy();

    const result = intelligence.executiveDecision.service.evaluate(
      makeRequest([createPresetScenario("campus_expansion")])
    );
    expect(result.graphId).toBeTruthy();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
