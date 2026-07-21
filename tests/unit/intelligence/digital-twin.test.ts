/** Organizational Digital Twin unit tests (Sprint 071 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createDigitalTwin,
  DIGITAL_TWIN_VERSION,
  DIGITAL_TWIN_MODULE_ID,
  SimulationEngine,
  ConstraintEngine,
  buildOrganizationModel,
  type PortfolioResultLight,
  type InitiativeResultLight,
} from "@/lib/platform/intelligence/digital-twin";
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
  "executive-predictive", "executive-autonomous", "executive-copilot",
  "executive-command-center", "initiative-intelligence", "portfolio-intelligence",
  "digital-twin",
"ecosystem-intelligence",
];

function samplePortfolio(): PortfolioResultLight {
  return {
    contributingDomains: ["portfolio-intelligence"],
    health: { value: 62, state: "watch", riskIndex: 45, capacityUtilization: 0.72, strategicCoverage: 70 },
    capacity: { budgetUtilization: 0.7, staffUtilization: 0.75, overcommitted: false, bottlenecks: [] },
    analytics: { portfolioValue: 500_000, expectedRoi: 1.2 },
    prioritization: [
      { initiativeId: "i1", title: "Increase Enrollment", composite: 78, rank: 1 },
      { initiativeId: "i2", title: "Teacher Recruitment", composite: 71, rank: 2 },
    ],
  };
}

function sampleInitiatives(): InitiativeResultLight {
  return {
    contributingDomains: ["initiative-intelligence"],
    activeCount: 2,
    atRiskCount: 1,
    initiatives: [
      {
        id: "i1",
        title: "Increase Enrollment",
        state: "active",
        executiveSummary: "Grow enrollment",
        progress: { percentComplete: 40, healthScore: 62 },
        budget: { planned: 120_000, actual: 40_000, forecast: 125_000 },
      },
      {
        id: "i2",
        title: "Teacher Recruitment",
        state: "at_risk",
        progress: { percentComplete: 25, healthScore: 38 },
        budget: { planned: 100_000, actual: 55_000, forecast: 130_000 },
      },
    ],
  };
}

describe("Organizational Digital Twin (Sprint 071)", () => {
  beforeEach(() => {
    resetPlatformIdSeqForTests();
  });

  it("exports Sprint 071 version and module id", () => {
    expect(DIGITAL_TWIN_VERSION).toBe("0.1.0");
    expect(DIGITAL_TWIN_MODULE_ID).toBe("digital-twin");
  });

  it("builds a live organizational model from soft-reads", () => {
    const model = buildOrganizationModel({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      portfolio: samplePortfolio(),
      initiatives: sampleInitiatives(),
    });
    expect(model.initiatives.length).toBe(2);
    expect(model.portfolio.health).toBe(62);
    expect(model.finance.operatingBudget).toBeGreaterThan(0);
  });

  it("runs isolated scenario simulations without mutating baseline", () => {
    const { service } = createDigitalTwin({
      createId: (p) => `${p}-x`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "dt-1",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      portfolioResult: samplePortfolio(),
      initiativeResult: sampleInitiatives(),
    });
    expect(result.simulations.length).toBeGreaterThan(0);
    expect(result.simulations.every((s) => s.isolated === true)).toBe(true);
    expect(result.liveModel.staffing.headcount).toBeGreaterThan(0);
    // Baseline live model should not equal a hire simulation headcount blindly
    const hire = result.simulations.find((s) =>
      result.scenarios.find((sc) => sc.id === s.scenarioId && sc.kind === "hire_teachers")
    );
    expect(hire).toBeTruthy();
    expect(hire!.model.staffing.headcount).toBeGreaterThan(result.liveModel.staffing.headcount);
  });

  it("enforces constraints with explanations", () => {
    const engine = new ConstraintEngine((p) => `${p}-c`);
    const model = buildOrganizationModel({
      scope: { organizationId: "org-1", schoolId: null },
      portfolio: samplePortfolio(),
      initiatives: sampleInitiatives(),
    });
    model.finance.forecast = model.finance.operatingBudget * 2;
    const constraints = engine.evaluate(model, {
      id: "s1",
      kind: "open_location",
      label: "Open",
      description: "Open",
      parameters: {},
    });
    expect(constraints.some((c) => c.kind === "budget_ceiling" && c.violated)).toBe(true);
    expect(constraints.find((c) => c.violated)?.explanation.length).toBeGreaterThan(0);
  });

  it("analyzes cross-domain impacts", () => {
    const sim = new SimulationEngine(
      (p) => `${p}-i`,
      () => new Date("2026-07-19T12:00:00.000Z")
    );
    const baseline = buildOrganizationModel({
      scope: { organizationId: "org-1", schoolId: null },
      portfolio: samplePortfolio(),
      initiatives: sampleInitiatives(),
    });
    const state = sim.simulate(baseline, {
      id: "sc1",
      kind: "increase_enrollment",
      label: "Enrollment +20%",
      description: "Lift",
      parameters: { enrollmentLiftPct: 20 },
    });
    expect(state.impacts.some((i) => i.domain === "enrollment")).toBe(true);
    expect(state.impacts.some((i) => i.domain === "finance")).toBe(true);
  });

  it("compares scenarios and produces advisory recommendation", () => {
    const { service } = createDigitalTwin({ createId: (p) => `${p}-cmp` });
    const result = service.build({
      requestId: "dt-cmp",
      scope: { organizationId: "org-1", schoolId: null },
      portfolioResult: samplePortfolio(),
      initiativeResult: sampleInitiatives(),
    });
    expect(result.comparisons.length).toBeGreaterThan(0);
    expect(result.recommendation.advisoryOnly).toBe(true);
    expect(result.recommendation.mayAutoExecute).toBe(false);
    expect(result.recommendation.humanAuthorizationRequired).toBe(true);
    expect(result.explainability.confidence).toBeGreaterThan(0);
  });

  it("wires into createIntelligenceService DI", () => {
    const stacks = createIntelligenceService({ eagerStacks: true });
    expect(stacks.digitalTwin.service).toBeTruthy();
    const result = stacks.digitalTwin.service.build({
      requestId: "dt-di",
      scope: { organizationId: "org-1", schoolId: null },
      portfolioResult: samplePortfolio(),
    });
    expect(result.version).toBe(DIGITAL_TWIN_VERSION);
  });

  it("runs in pipeline after portfolio-intelligence and before ecosystem-intelligence", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-19T12:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });
    const health = await platform.checkHealth();
    expect(health.modules.length).toBe(51);
    expect(platform.registry.get("digital-twin")?.id).toBe("digital-twin");

    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
      input: { periodLabel: "Sprint 071 validation", role: "ceo" },
    });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual(PIPELINE_ORDER);
    expect(result.moduleOrder.at(-3)).toBe("portfolio-intelligence");
    expect(result.moduleOrder.at(-2)).toBe("digital-twin");
    expect(result.moduleOrder.at(-1)).toBe("ecosystem-intelligence");
    expect(result.results.every((item) => item.ok)).toBe(true);
  });

  it("enriches ECC with digital twin widgets via soft-read", async () => {
    const { service: twin } = createDigitalTwin({ createId: (p) => `${p}-ecc` });
    const twinResult = twin.build({
      requestId: "dt-ecc",
      scope: { organizationId: "org-1", schoolId: null },
      portfolioResult: samplePortfolio(),
      initiativeResult: sampleInitiatives(),
    });
    const { createExecutiveCommandCenter } = await import(
      "@/lib/platform/intelligence/executive-command-center"
    );
    const ecc = createExecutiveCommandCenter({ createId: (p) => `${p}-w` });
    const workspace = ecc.service.build({
      requestId: "ecc-twin",
      scope: { organizationId: "org-1", schoolId: null },
      role: "ceo",
      digitalTwinResult: {
        simulations: twinResult.simulations,
        scenarios: twinResult.scenarios,
        comparisons: twinResult.comparisons,
        recommendation: twinResult.recommendation,
        explainability: twinResult.explainability,
        contributingDomains: twinResult.contributingDomains,
      },
    });
    const kinds = new Set(workspace.widgets.map((w) => w.kind));
    expect(kinds.has("active_simulations")).toBe(true);
    expect(kinds.has("recommended_scenario")).toBe(true);
    expect(kinds.has("constraint_alerts")).toBe(true);
  });
});
