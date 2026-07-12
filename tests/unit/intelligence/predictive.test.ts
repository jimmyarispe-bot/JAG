/**
 * Predictive Intelligence — unit tests (Sprint 028).
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  createForecastScenario,
  createPredictiveIntelligence,
  type PredictionRequest,
} from "@/lib/platform/intelligence/predictive-intelligence";
import { resetGraphEdgeSeqForTests } from "@/lib/platform/intelligence/executive-graph";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

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
  scenarios: PredictionRequest["scenarios"]
): PredictionRequest {
  return {
    requestId: "pred-test-1",
    question: "What should leadership anticipate?",
    scenarios,
    graphInput: graphInput(),
    scope: { organizationId: "org-1", schoolId: "school-1" },
    horizons: [30, 90, 180, 365],
    maxActions: 6,
    maxRisks: 6,
    thresholds: {
      enrollment: 110,
      cash_flow: 50000,
      risk: 0.4,
    },
  };
}

describe("Predictive Intelligence (Sprint 028)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("generates multi-horizon forecasts across domains", () => {
    const { service } = createPredictiveIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
    });

    const result = service.predict(
      makeRequest([
        createForecastScenario("baseline"),
        createForecastScenario("pessimistic", { magnitude: 0.12 }),
      ])
    );

    expect(result.horizons).toEqual([30, 90, 180, 365]);
    expect(result.scenarioForecasts).toHaveLength(2);
    const baseline = result.scenarioForecasts[0]!;
    expect(baseline.domains.length).toBeGreaterThanOrEqual(11);
    for (const domain of baseline.domains) {
      expect(domain.points).toHaveLength(4);
      expect(domain.points[0]!.low).toBeLessThanOrEqual(domain.points[0]!.value);
      expect(domain.points[0]!.high).toBeGreaterThanOrEqual(domain.points[0]!.value);
      expect(domain.trend.direction).toBeTruthy();
    }
    expect(result.projection.headline.length).toBeGreaterThan(0);
    expect(result.historyRecord.status).toBe("generated");
    expect(result.confidence.value).toBeGreaterThan(0);
  });

  it("detects declining trends and emerging risks under pessimistic scenario", () => {
    const { service } = createPredictiveIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
    });

    const result = service.predict(
      makeRequest([createForecastScenario("pessimistic", { magnitude: 0.15 })])
    );

    const forecast = result.scenarioForecasts[0]!;
    expect(forecast.emergingRisks.length).toBeGreaterThan(0);
    expect(forecast.preventiveActions.length).toBeGreaterThan(0);
    expect(forecast.preventiveActions[0]!.executiveSummary.length).toBeGreaterThan(0);
    expect(
      forecast.domains.some(
        (d) =>
          d.thresholdCrossings.length > 0 ||
          d.trend.direction === "declining" ||
          d.trend.direction === "volatile"
      )
    ).toBe(true);
  });

  it("supports trend analysis and forecast queries", () => {
    const { service } = createPredictiveIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
    });

    const request = makeRequest([createForecastScenario("baseline")]);
    const trends = service.analyzeTrends(request);
    expect(trends.length).toBeGreaterThanOrEqual(11);
    expect(trends.every((t) => t.domain && t.direction)).toBe(true);

    const result = service.predict(request);
    const answer = service.query(result, {
      question: "What risks should we watch?",
      focus: "risk",
    });
    expect(answer.answer.length).toBeGreaterThan(0);
    expect(answer.confidence.value).toBeGreaterThan(0);
  });

  it("stores history and repository entries", () => {
    const { service } = createPredictiveIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
    });

    const result = service.predict(
      makeRequest([createForecastScenario("optimistic", { magnitude: 0.08 })])
    );

    expect(service.history().list().length).toBeGreaterThanOrEqual(1);
    expect(service.repository().get(result.scenarioForecasts[0]!.scenario.id)).toBeTruthy();
  });

  it("wires predictiveIntelligence onto createIntelligenceService", () => {
    const service = createIntelligenceService();
    expect(service.predictiveIntelligence).toBeTruthy();
    expect(service.predictiveIntelligence.service).toBeTruthy();

    const result = service.predictiveIntelligence.service.predict({
      requestId: "wired-1",
      scenarios: [createForecastScenario("baseline")],
      horizons: [30, 90],
      domains: ["enrollment", "revenue", "cash_flow"],
    });
    expect(result.scenarioForecasts[0]?.domains.length).toBe(3);
  });

  it("runs as the terminal platform module after executive-decision", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-12T16:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });

    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
    });

    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual([
      "organization-dna",
      "oios-core",
      "organization-health",
      "financial",
      "founder",
      "executive",
      "executive-graph",
      "executive-decision",
      "predictive",
      "board-governance",
      "human-capital",
      "revenue",
      "funding",
      "opportunity",
      "organizational-improvement",
      "business-model",
      "operations",
      "customer",
    ]);
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
