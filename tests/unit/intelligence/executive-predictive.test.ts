/** Predictive Intelligence unit tests (Sprint 065 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createExecutivePredictiveIntelligence,
  EXECUTIVE_PREDICTIVE_VERSION,
  EXECUTIVE_PREDICTIVE_MODULE_ID,
  ForecastEngine,
  ScenarioEngine,
  SignalEngine,
  DecisionImpactEngine,
  DriftEngine,
  buildExplainability,
  type BriefingResultLight,
  type DecisionIntelligenceResultLight,
  type HistoricalSignal,
} from "@/lib/platform/intelligence/executive-predictive";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

const PIPELINE_ORDER = [
  "organization-dna", "oios-core", "organization-health", "financial", "founder",
  "executive", "executive-graph", "executive-decision", "predictive", "board-governance",
  "human-capital", "revenue", "funding", "opportunity", "organizational-improvement",
  "business-model", "operations", "customer", "knowledge", "document",
  "legal-compliance-risk", "market", "innovation", "impact", "economic", "competitive",
  "political", "environmental", "stakeholder", "reputation", "behavioral", "cultural",
  "ethical", "systems", "resilience", "ecosystem", "institutional-memory", "collective",
  "wisdom", "synthesis", "briefing", "executive-memory", "decision-intelligence",
  "executive-predictive", "executive-autonomous", "executive-copilot", "executive-command-center", "initiative-intelligence", "portfolio-intelligence", "digital-twin",
"ecosystem-intelligence",
];

function sampleSignals(): HistoricalSignal[] {
  return [
    {
      id: "e1",
      subject: "enrollment",
      at: "2026-01-01T00:00:00.000Z",
      value: 120,
      direction: "up",
      narrative: "Strong winter inquiry conversion",
    },
    {
      id: "e2",
      subject: "enrollment",
      at: "2026-04-01T00:00:00.000Z",
      value: 110,
      direction: "down",
      narrative: "Conversion softening",
    },
    {
      id: "o1",
      subject: "operations",
      at: "2026-01-01T00:00:00.000Z",
      value: 60,
      direction: "flat",
    },
    {
      id: "o2",
      subject: "operations",
      at: "2026-04-01T00:00:00.000Z",
      value: 72,
      direction: "up",
      narrative: "Support volume rising",
    },
    {
      id: "s1",
      subject: "staffing",
      at: "2026-01-01T00:00:00.000Z",
      value: 42,
      direction: "flat",
    },
    {
      id: "s2",
      subject: "staffing",
      at: "2026-04-01T00:00:00.000Z",
      value: 38,
      direction: "down",
    },
    {
      id: "r1",
      subject: "retention",
      at: "2026-01-01T00:00:00.000Z",
      value: 0.94,
      direction: "flat",
    },
    {
      id: "r2",
      subject: "retention",
      at: "2026-04-01T00:00:00.000Z",
      value: 0.9,
      direction: "down",
    },
  ];
}

function sampleDecision(): DecisionIntelligenceResultLight {
  return {
    requestId: "di-1",
    contributingDomains: ["human-capital", "finance"],
    recommendation: {
      id: "rec-1",
      executiveSummary: "Prioritize staffing response before enrollment slips further.",
      recommendedOptionId: "opt-a",
      confidence: 0.72,
      issue: { title: "Teacher shortage", kind: "staffing", domains: ["human-capital"] },
      rankedOptions: [
        {
          id: "opt-a",
          title: "Hire temporary teachers",
          summary: "Bridge capacity for 90 days",
          category: "staffing",
          confidence: 0.74,
          estimatedEffort: "medium",
          scorecard: {
            overall: 78,
            expectedImpact: 80,
            financialImpact: 55,
            operationalImpact: 70,
            risk: 40,
            effort: 50,
          },
        },
        {
          id: "opt-b",
          title: "Reallocate existing staff",
          summary: "Shift FTE without new hires",
          category: "staffing",
          confidence: 0.66,
          estimatedEffort: "low",
          scorecard: {
            overall: 70,
            expectedImpact: 65,
            financialImpact: 80,
            operationalImpact: 55,
            risk: 50,
            effort: 30,
          },
        },
      ],
    },
  };
}

function sampleBriefing(): BriefingResultLight {
  return {
    healthScore: { value: 58, label: "watch" },
    contributingDomains: ["briefing"],
    overnight: {
      summary: "Support tickets up overnight",
      newRisks: ["Rising parent support volume"],
      staffingChanges: [],
      financialMovement: [],
    },
    briefing: {
      sections: {
        executiveSummary: "Enrollment conversion and staffing capacity are co-moving.",
        topRisks: [
          {
            title: "Conversion decline",
            summary: "Inquiry-to-enrollment conversion softening",
            severity: 70,
            urgency: 65,
            domains: ["enrollment", "customer"],
          },
        ],
      },
    },
  };
}

describe("Predictive Intelligence (Sprint 065)", () => {
  beforeEach(() => {
    resetPlatformIdSeqForTests();
  });

  it("exports Sprint 065 version and module id", () => {
    expect(EXECUTIVE_PREDICTIVE_VERSION).toBe("0.1.0");
    expect(EXECUTIVE_PREDICTIVE_MODULE_ID).toBe("executive-predictive");
  });

  it("generates organizational forecasts with assumptions and confidence", () => {
    const { service } = createExecutivePredictiveIntelligence({
      createId: (p) => `${p}-f`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "pred-f",
      scope: { organizationId: "org-1", schoolId: "fl-1" },
      historicalSignals: sampleSignals(),
      briefingResult: sampleBriefing(),
    });
    expect(result.forecasts.length).toBeGreaterThanOrEqual(8);
    const enrollment = result.forecasts.find((f) => f.subject === "enrollment");
    expect(enrollment).toBeTruthy();
    expect(enrollment!.assumptions.length).toBeGreaterThan(0);
    expect(enrollment!.confidence).toBeGreaterThan(0);
    expect(enrollment!.confidence).toBeLessThanOrEqual(1);
    expect(enrollment!.points.length).toBe(4);
  });

  it("creates best / expected / worst scenarios", () => {
    const forecasts = new ForecastEngine({
      createId: (p) => `${p}-s`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    }).forecastAll({ signals: sampleSignals() });
    const scenarios = new ScenarioEngine({ createId: (p) => `${p}-sc` }).buildScenarios({
      forecasts,
      periodLabel: "Q3",
    });
    expect(scenarios.map((s) => s.kind)).toEqual(
      expect.arrayContaining(["best", "expected", "worst"])
    );
    expect(scenarios.find((s) => s.kind === "expected")?.probability).toBeGreaterThan(0.4);
  });

  it("detects emerging weak signals", () => {
    const signals = new SignalEngine({
      createId: (p) => `${p}-sig`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    }).detect({ signals: sampleSignals(), briefing: sampleBriefing() });
    expect(signals.length).toBeGreaterThan(0);
    expect(
      signals.some((s) => /conversion|workload|absenteeism|staff/i.test(s.title + s.narrative))
    ).toBe(true);
  });

  it("forecasts decision option impacts", () => {
    const forecasts = new ForecastEngine({
      createId: (p) => `${p}-di`,
    }).forecastAll({ signals: sampleSignals() });
    const scenarios = new ScenarioEngine({ createId: (p) => `${p}-dsc` }).buildScenarios({
      forecasts,
    });
    const impacts = new DecisionImpactEngine({ createId: (p) => `${p}-imp` }).forecastImpacts({
      decision: sampleDecision(),
      scenarios,
      historical: sampleSignals(),
    });
    expect(impacts).toHaveLength(2);
    expect(impacts[0].organizationalImpact).toBeGreaterThan(0);
    expect(impacts[0].implementationHorizon).toBeTruthy();
    expect(impacts[0].explainability.why.length).toBeGreaterThan(10);
  });

  it("provides prediction explainability", () => {
    const explain = buildExplainability({
      subject: "enrollment",
      horizon: "90d",
      why: "Enrollment trend extrapolation",
      historical: sampleSignals().filter((s) => s.subject === "enrollment"),
      current: [
        {
          id: "c1",
          statement: "Conversion risk in briefing",
          source: "current_signal",
          supporting: false,
        },
      ],
      assumptions: [
        { id: "a1", statement: "Seasonality holds", critical: true },
      ],
    });
    expect(explain.historicalEvidence.length).toBeGreaterThan(0);
    expect(explain.currentSignals.length).toBe(1);
    expect(explain.invalidatingAssumptions.length).toBeGreaterThan(0);
    expect(explain.confidenceGuidance.length).toBeGreaterThan(10);
  });

  it("detects forecast drift vs actuals", () => {
    const forecasts = new ForecastEngine({
      createId: (p) => `${p}-dr`,
    }).forecastAll({ signals: sampleSignals() });
    const report = new DriftEngine({ createId: (p) => `${p}-d` }).evaluate({
      forecasts,
      actuals: [
        { subject: "enrollment", value: forecasts.find((f) => f.subject === "enrollment")!.projectedValue * 0.7 },
        { subject: "operations", value: forecasts.find((f) => f.subject === "operations")!.projectedValue * 1.3 },
      ],
    });
    expect(report.observations.length).toBe(2);
    expect(report.meanAbsoluteError).toBeGreaterThan(0);
    expect(report.calibrationNote.length).toBeGreaterThan(10);
  });

  it("handles empty history with advisory confidence", () => {
    const { service } = createExecutivePredictiveIntelligence({
      createId: (p) => `${p}-empty`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "pred-empty",
      scope: { organizationId: "org-1", schoolId: null },
      historicalSignals: [],
    });
    expect(result.forecasts.length).toBeGreaterThan(0);
    expect(result.explainability.invalidatingAssumptions.some((a) => /No historical/i.test(a))).toBe(
      true
    );
    expect(result.metadata.advisory).toBe(true);
  });

  it("handles sparse data without throwing", () => {
    const { service } = createExecutivePredictiveIntelligence({
      createId: (p) => `${p}-sparse`,
    });
    const result = service.build({
      requestId: "pred-sparse",
      scope: { organizationId: null, schoolId: null },
      historicalSignals: [
        {
          id: "one",
          subject: "cash",
          at: "2026-06-01T00:00:00.000Z",
          value: 200_000,
          direction: "unknown",
        },
      ],
    });
    expect(result.scenarios.length).toBeGreaterThanOrEqual(3);
    expect(result.registry.length).toBe(result.forecasts.length);
  });

  it("lowers confidence on contradictory signals", () => {
    const contradictory: HistoricalSignal[] = [
      {
        id: "u1",
        subject: "revenue",
        at: "2026-01-01T00:00:00.000Z",
        value: 100,
        direction: "up",
      },
      {
        id: "d1",
        subject: "revenue",
        at: "2026-03-01T00:00:00.000Z",
        value: 90,
        direction: "down",
      },
      {
        id: "u2",
        subject: "revenue",
        at: "2026-05-01T00:00:00.000Z",
        value: 110,
        direction: "up",
      },
    ];
    const forecast = new ForecastEngine({ createId: (p) => `${p}-c` }).forecastSubject({
      subject: "revenue",
      horizon: "90d",
      signals: contradictory,
    });
    expect(forecast.confidence).toBeLessThan(0.75);
    expect(
      forecast.explainability.invalidatingAssumptions.some((a) => /disagree|regime/i.test(a))
    ).toBe(true);
  });

  it("compares Option A vs Option B decision impacts", () => {
    const { service } = createExecutivePredictiveIntelligence({
      createId: (p) => `${p}-ab`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "pred-ab",
      scope: { organizationId: "org-1", schoolId: "fl-1" },
      historicalSignals: sampleSignals(),
      decisionResult: sampleDecision(),
      briefingResult: sampleBriefing(),
      customScenario: { label: "Option B lean", magnitude: 0.04 },
    });
    expect(result.decisionImpacts.length).toBe(2);
    expect(result.scenarios.some((s) => s.kind === "custom")).toBe(true);
    const a = result.decisionImpacts.find((i) => i.optionId === "opt-a");
    const b = result.decisionImpacts.find((i) => i.optionId === "opt-b");
    expect(a && b).toBeTruthy();
    expect(a!.financialImpact).not.toBe(b!.financialImpact);
  });

  it("wires into createIntelligenceService DI", () => {
    const stacks = createIntelligenceService({ eagerStacks: true });
    expect(stacks.executivePredictive.service).toBeTruthy();
    const result = stacks.executivePredictive.service.build({
      requestId: "pred-di",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      historicalSignals: sampleSignals(),
    });
    expect(result.version).toBe(EXECUTIVE_PREDICTIVE_VERSION);
  });

  it("runs as terminal pipeline module after decision-intelligence", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-19T12:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });
    const health = await platform.checkHealth();
    expect(health.modules.length).toBe(51);
    expect(platform.registry.get("executive-predictive")?.id).toBe("executive-predictive");

    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
      input: { periodLabel: "Sprint 065 validation" },
    });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual(PIPELINE_ORDER);
    expect(result.moduleOrder.at(-9)).toBe("decision-intelligence");
    expect(result.moduleOrder.at(-8)).toBe("executive-predictive");
    expect(result.moduleOrder.at(-5)).toBe("executive-command-center");
    expect(result.moduleOrder.at(-4)).toBe("initiative-intelligence");
    expect(result.moduleOrder.at(-3)).toBe("portfolio-intelligence");
    expect(result.moduleOrder.at(-2)).toBe("digital-twin");
    expect(result.moduleOrder.at(-1)).toBe("ecosystem-intelligence");
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
