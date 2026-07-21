/** Portfolio Intelligence unit tests (Sprint 070 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createPortfolioIntelligence,
  PORTFOLIO_INTELLIGENCE_VERSION,
  PORTFOLIO_INTELLIGENCE_MODULE_ID,
  scoreStrategicAlignment,
  detectCrossInitiativeDependencies,
  type InitiativeResultLight,
  type ExecutivePredictiveResultLight,
} from "@/lib/platform/intelligence/portfolio-intelligence";
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
  "executive-command-center", "initiative-intelligence", "portfolio-intelligence", "digital-twin",
"ecosystem-intelligence",
];

function sampleInitiatives(): InitiativeResultLight {
  return {
    contributingDomains: ["initiative-intelligence"],
    activeCount: 3,
    atRiskCount: 1,
    completedCount: 0,
    initiatives: [
      {
        id: "i1",
        title: "Increase Enrollment",
        executiveSummary: "Grow enrollment for mission student outcomes",
        state: "active",
        targetCompletionDate: "2026-10-01T00:00:00.000Z",
        progress: {
          percentComplete: 40,
          healthScore: 62,
          healthStatus: "watch",
          kpiAchievement: 45,
          scheduleVarianceDays: -5,
        },
        budget: { planned: 120_000, actual: 40_000, forecast: 125_000 },
        owners: [
          { role: "executive_sponsor", assignmentKey: "role:executive" },
          { role: "initiative_owner", assignmentKey: "role:school_leader" },
        ],
        risks: [{ title: "Conversion soft", severity: 70, likelihood: 60, status: "open" }],
        milestones: [
          { id: "m1", title: "Campaign launch", status: "in_progress", percentComplete: 40 },
        ],
        metadata: { category: "enrollment" },
      },
      {
        id: "i2",
        title: "Teacher Recruitment",
        executiveSummary: "Hire teachers to protect quality",
        state: "at_risk",
        targetCompletionDate: "2026-10-10T00:00:00.000Z",
        progress: {
          percentComplete: 25,
          healthScore: 38,
          healthStatus: "at_risk",
          kpiAchievement: 20,
        },
        budget: { planned: 100_000, actual: 55_000, forecast: 130_000 },
        owners: [
          { role: "executive_sponsor", assignmentKey: "role:executive" },
          { role: "initiative_owner", assignmentKey: "role:hr_lead" },
        ],
        risks: [{ title: "Candidate pipeline", severity: 80, likelihood: 70, status: "open" }],
        milestones: [
          { id: "m2", title: "Campaign launch", status: "pending", percentComplete: 10 },
        ],
        metadata: { category: "staffing" },
      },
      {
        id: "i3",
        title: "Reduce Operating Costs",
        executiveSummary: "Efficiency and financial sustainability",
        state: "planned",
        progress: { percentComplete: 10, healthScore: 70, healthStatus: "healthy", kpiAchievement: 15 },
        budget: { planned: 80_000, actual: 5_000, forecast: 80_000 },
        owners: [{ role: "initiative_owner", assignmentKey: "role:finance_owner" }],
        metadata: { category: "efficiency" },
      },
    ],
  };
}

describe("Portfolio Intelligence (Sprint 070)", () => {
  beforeEach(() => {
    resetPlatformIdSeqForTests();
  });

  it("exports Sprint 070 version and module id", () => {
    expect(PORTFOLIO_INTELLIGENCE_VERSION).toBe("0.1.0");
    expect(PORTFOLIO_INTELLIGENCE_MODULE_ID).toBe("portfolio-intelligence");
  });

  it("scores strategic alignment with explainability", () => {
    const alignment = scoreStrategicAlignment(
      {
        title: "Increase Enrollment",
        executiveSummary: "mission student outcomes and enrollment growth",
        state: "active",
        progress: { healthScore: 70 },
      },
      {
        requestId: "a",
        scope: { organizationId: "org-1", schoolId: null },
        missionHint: "student outcomes mission",
        annualObjectives: ["enrollment", "quality"],
        boardGoals: ["mission fidelity"],
      }
    );
    expect(["high", "medium", "low"]).toContain(alignment.band);
    expect(alignment.explainability.length).toBeGreaterThan(10);
    expect(alignment.factors.length).toBeGreaterThanOrEqual(4);
  });

  it("prioritizes initiatives with composite scores", () => {
    const { service } = createPortfolioIntelligence({
      createId: (p) => `${p}-p`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "pf-1",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      initiativeResult: sampleInitiatives(),
      missionHint: "student outcomes mission",
    });
    expect(result.prioritization.length).toBe(3);
    expect(result.prioritization[0]!.rank).toBe(1);
    expect(result.prioritization[0]!.composite).toBeGreaterThanOrEqual(
      result.prioritization[1]!.composite
    );
    expect(result.scored.every((s) => s.alignment.explainability)).toBe(true);
  });

  it("calculates capacity and detects overcommitment signals", () => {
    const { service } = createPortfolioIntelligence({ createId: (p) => `${p}-c` });
    const many = sampleInitiatives();
    many.initiatives = [
      ...(many.initiatives ?? []),
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `extra-${i}`,
        title: `Extra ${i}`,
        state: "active",
        progress: { percentComplete: 20, healthScore: 50 },
        budget: { planned: 90_000, actual: 40_000, forecast: 90_000 },
        owners: [{ role: "executive_sponsor", assignmentKey: "role:executive" }],
      })),
    ];
    const result = service.build({
      requestId: "pf-cap",
      scope: { organizationId: "org-1", schoolId: null },
      initiativeResult: many,
    });
    expect(result.capacity.staffUtilization).toBeGreaterThan(0);
    expect(result.capacity.recommendations.length).toBeGreaterThan(0);
  });

  it("allocates resources without duplicating finance engines", () => {
    const { service } = createPortfolioIntelligence({ createId: (p) => `${p}-a` });
    const result = service.build({
      requestId: "pf-alloc",
      scope: { organizationId: "org-1", schoolId: null },
      initiativeResult: sampleInitiatives(),
    });
    const shares = result.allocations.reduce((acc, a) => acc + a.budgetShare, 0);
    expect(result.allocations.length).toBe(3);
    expect(shares).toBeGreaterThan(90);
    expect(result.allocations[0]!.notes.some((n) => /advisory/i.test(n))).toBe(true);
  });

  it("detects cross-initiative dependencies", () => {
    const deps = detectCrossInitiativeDependencies(
      (p) => `${p}-d`,
      sampleInitiatives().initiatives ?? []
    );
    expect(deps.some((d) => d.kind === "shared_owner" || d.kind === "shared_milestone" || d.kind === "conflicting_timeline")).toBe(
      true
    );
  });

  it("computes portfolio health states", () => {
    const { service } = createPortfolioIntelligence({ createId: (p) => `${p}-h` });
    const result = service.build({
      requestId: "pf-h",
      scope: { organizationId: "org-1", schoolId: null },
      initiativeResult: sampleInitiatives(),
    });
    expect([
      "excellent",
      "healthy",
      "watch",
      "at_risk",
      "critical",
    ]).toContain(result.health.state);
    expect(result.health.value).toBeGreaterThanOrEqual(0);
  });

  it("builds advisory roadmap optimizations respecting governance", () => {
    const { service } = createPortfolioIntelligence({ createId: (p) => `${p}-o` });
    const result = service.build({
      requestId: "pf-o",
      scope: { organizationId: "org-1", schoolId: null },
      initiativeResult: sampleInitiatives(),
    });
    expect(result.optimizations.every((o) => o.advisory === true)).toBe(true);
    expect(
      result.optimizations.every((o) => /human authorization|sprint 066/i.test(o.governanceNote))
    ).toBe(true);
    expect(result.roadmap.length).toBe(3);
    expect(result.metadata.autoExecute).toBe(false);
  });

  it("generates portfolio scenarios with predictive soft-reads", () => {
    const predictive: ExecutivePredictiveResultLight = {
      contributingDomains: ["executive-predictive"],
      forecasts: [{ subject: "enrollment", direction: "improving", confidence: 0.7 }],
      scenarios: [{ kind: "base", label: "Base", narrative: "Steady enrollment recovery" }],
    };
    const { service } = createPortfolioIntelligence({ createId: (p) => `${p}-s` });
    const result = service.build({
      requestId: "pf-s",
      scope: { organizationId: "org-1", schoolId: null },
      initiativeResult: sampleInitiatives(),
      predictiveResult: predictive,
      customScenario: { label: "Board stress test", budgetMultiplier: 0.8, capacityMultiplier: 0.9 },
    });
    expect(result.scenarios.some((s) => s.kind === "current")).toBe(true);
    expect(result.scenarios.some((s) => s.kind === "hiring_freeze")).toBe(true);
    expect(result.scenarios.some((s) => s.kind === "custom")).toBe(true);
    expect(result.scenarios[0]!.narrative).toMatch(/advisory|authorization|predictive/i);
  });

  it("wires into createIntelligenceService DI", () => {
    const stacks = createIntelligenceService({ eagerStacks: true });
    expect(stacks.portfolioIntelligence.service).toBeTruthy();
    const result = stacks.portfolioIntelligence.service.build({
      requestId: "pf-di",
      scope: { organizationId: "org-1", schoolId: null },
      initiativeResult: sampleInitiatives(),
    });
    expect(result.version).toBe(PORTFOLIO_INTELLIGENCE_VERSION);
  });

  it("runs in pipeline before digital-twin", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-19T12:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });
    const health = await platform.checkHealth();
    expect(health.modules.length).toBe(51);
    expect(platform.registry.get("portfolio-intelligence")?.id).toBe(
      "portfolio-intelligence"
    );

    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
      input: { periodLabel: "Sprint 070 validation", role: "ceo" },
    });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual(PIPELINE_ORDER);
    expect(result.moduleOrder.at(-3)).toBe("portfolio-intelligence");
    expect(result.moduleOrder.at(-2)).toBe("digital-twin");
    expect(result.moduleOrder.at(-1)).toBe("ecosystem-intelligence");
    expect(result.results.every((item) => item.ok)).toBe(true);
  });

  it("integrates with Executive Command Center enrichment", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-19T12:00:00.000Z"),
        createId: (prefix) => `${prefix}-ecc`,
      },
    });
    const run = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
      input: { role: "ceo" },
    });
    const pf = run.results.find((r) => r.moduleId === "portfolio-intelligence");
    expect(pf?.ok).toBe(true);
    const data = pf?.data as { health: { value: number }; prioritization: unknown[] };
    expect(data.health.value).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(data.prioritization)).toBe(true);
  });
});
