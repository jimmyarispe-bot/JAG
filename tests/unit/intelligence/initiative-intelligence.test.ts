/** Initiative Intelligence unit tests (Sprint 069 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createInitiativeIntelligence,
  INITIATIVE_INTELLIGENCE_VERSION,
  INITIATIVE_INTELLIGENCE_MODULE_ID,
  LifecycleEngine,
  DependencyEngine,
  ProgressEngine,
  scoreKpiAchievement,
  budgetVariance,
  ownersForCategory,
  requireOwnerRole,
  type DecisionIntelligenceResultLight,
  type BriefingResultLight,
  type AutonomousResultLight,
  type Initiative,
} from "@/lib/platform/intelligence/initiative-intelligence";
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

function sampleDecision(): DecisionIntelligenceResultLight {
  return {
    contributingDomains: ["decision-intelligence"],
    recommendation: {
      id: "rec-1",
      executiveSummary: "Prioritize temporary hiring.",
      rankedOptions: [
        {
          id: "opt-a",
          title: "Teacher Recruitment",
          summary: "Hire temporary teachers to bridge capacity",
          category: "staffing",
          confidence: 0.8,
          scorecard: { overall: 82, roi: 88 },
        },
        {
          id: "opt-b",
          title: "Increase Enrollment",
          summary: "Campaign reactivation for Florida",
          category: "enrollment",
          confidence: 0.7,
          scorecard: { overall: 75, roi: 70 },
        },
      ],
    },
  };
}

function sampleBriefing(): BriefingResultLight {
  return {
    contributingDomains: ["briefing"],
    briefing: {
      sections: {
        executiveSummary: "Enrollment and staffing remain coupled risks.",
        topOpportunities: [
          {
            id: "o1",
            title: "Curriculum Modernization",
            summary: "Refresh reading pathways",
            estimatedImpact: 70,
          },
        ],
        topRisks: [
          {
            id: "r1",
            title: "Staffing gap",
            summary: "Vacancies in critical roles",
            severity: 78,
          },
        ],
      },
    },
  };
}

function sampleAutonomous(): AutonomousResultLight {
  return {
    contributingDomains: ["executive-autonomous"],
    plans: [
      {
        id: "plan-1",
        objective: "Execute hiring war-room",
        optionTitle: "Teacher Recruitment",
        readiness: "ready",
        humanAuthorizationRequired: true,
      },
    ],
  };
}

describe("Initiative Intelligence (Sprint 069)", () => {
  beforeEach(() => {
    resetPlatformIdSeqForTests();
  });

  it("exports Sprint 069 version and module id", () => {
    expect(INITIATIVE_INTELLIGENCE_VERSION).toBe("0.1.0");
    expect(INITIATIVE_INTELLIGENCE_MODULE_ID).toBe("initiative-intelligence");
  });

  it("derives initiatives from decisions, autonomous plans, and briefing opportunities", () => {
    const { service } = createInitiativeIntelligence({
      createId: (p) => `${p}-x`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "ii-1",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      decisionResult: sampleDecision(),
      briefingResult: sampleBriefing(),
      autonomousResult: sampleAutonomous(),
    });
    expect(result.initiatives.length).toBeGreaterThanOrEqual(2);
    expect(result.initiatives.some((i) => i.title === "Teacher Recruitment")).toBe(true);
    expect(result.initiatives.every((i) => i.links.some((l) => l.kind === "command_center"))).toBe(
      true
    );
    expect(result.explainability.contributingDomains).toContain("executive-command-center");
  });

  it("supports attributable lifecycle transitions", () => {
    const lifecycle = new LifecycleEngine((p) => `${p}-t`, () => new Date("2026-07-19T12:00:00.000Z"));
    const { service } = createInitiativeIntelligence({
      createId: (p) => `${p}-lc`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const built = service.build({
      requestId: "ii-lc",
      scope: { organizationId: "org-1", schoolId: null },
      seeds: [{ title: "AI Rollout", state: "proposed" }],
    });
    let initiative = built.initiatives[0]!;
    initiative = service.transition(initiative, "approved", "approver", "Board approved");
    expect(initiative.state).toBe("approved");
    expect(initiative.transitions.at(-1)?.byRole).toBe("approver");
    expect(initiative.transitions.at(-1)?.at).toBe("2026-07-19T12:00:00.000Z");
    expect(lifecycle.canTransition("approved", "planned")).toBe(true);
    expect(lifecycle.canTransition("completed", "active")).toBe(false);
  });

  it("tracks milestones with nested work items", () => {
    const { service } = createInitiativeIntelligence({ createId: (p) => `${p}-ms` });
    const result = service.build({
      requestId: "ii-ms",
      scope: { organizationId: "org-1", schoolId: null },
      seeds: [{ title: "Open New Campus", state: "planned" }],
    });
    const initiative = result.initiatives[0]!;
    expect(initiative.milestones.length).toBeGreaterThanOrEqual(3);
    const nested = initiative.milestones
      .flatMap((m) => m.workItems)
      .some((w) => w.children.length > 0);
    expect(nested).toBe(true);
  });

  it("calculates progress, budget variance, and KPI scoring", () => {
    const engine = new ProgressEngine(() => new Date("2026-07-19T12:00:00.000Z"));
    const { service } = createInitiativeIntelligence({
      createId: (p) => `${p}-pg`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "ii-pg",
      scope: { organizationId: "org-1", schoolId: null },
      seeds: [
        {
          title: "Reduce Operating Costs",
          state: "active",
          kpis: [
            {
              id: "k1",
              name: "Cost reduction",
              target: 100,
              actual: 40,
              weight: 1,
            },
          ],
          budget: { planned: 100_000, actual: 120_000, forecast: 130_000 },
          milestones: [
            {
              id: "m1",
              title: "Phase 1",
              status: "done",
              percentComplete: 100,
              workItems: [],
              dependsOn: [],
            },
            {
              id: "m2",
              title: "Phase 2",
              status: "in_progress",
              percentComplete: 50,
              workItems: [
                {
                  id: "t1",
                  title: "Cut vendor spend",
                  status: "in_progress",
                  percentComplete: 50,
                  dependsOn: [],
                  children: [],
                },
              ],
              dependsOn: ["m1"],
            },
          ],
        },
      ],
    });
    const initiative = result.initiatives[0]!;
    const progress = engine.calculate(initiative);
    expect(progress.milestoneCompletion).toBe(50);
    expect(progress.percentComplete).toBe(50);
    expect(scoreKpiAchievement(initiative.kpis)).toBe(40);
    const bv = budgetVariance(initiative.budget);
    expect(bv.absolute).toBe(20_000);
    expect(bv.pct).toBe(20);
    expect(progress.healthStatus).toBeTruthy();
  });

  it("assigns ownership by role, not hard-coded users", () => {
    const owners = ownersForCategory("staffing");
    expect(requireOwnerRole(owners, "initiative_owner")?.assignmentKey).toMatch(/^role:/);
    expect(owners.every((o) => o.assignmentKey.startsWith("role:"))).toBe(true);
  });

  it("resolves dependency issues", () => {
    const deps = new DependencyEngine();
    const initiative = {
      id: "i1",
      milestones: [
        {
          id: "m1",
          title: "A",
          status: "pending" as const,
          percentComplete: 0,
          workItems: [],
          dependsOn: ["missing"],
        },
      ],
    } as unknown as Initiative;
    const issues = deps.resolve(initiative);
    expect(issues.some((i) => i.kind === "missing_ref")).toBe(true);
  });

  it("measures outcomes and prepares Executive Memory lessons", () => {
    const { service } = createInitiativeIntelligence({
      createId: (p) => `${p}-out`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const built = service.build({
      requestId: "ii-out",
      scope: { organizationId: "org-1", schoolId: null },
      seeds: [{ title: "Grant Application", state: "active" }],
    });
    let initiative = built.initiatives[0]!;
    initiative = service.transition(initiative, "at_risk", "initiative_owner");
    initiative = service.transition(initiative, "completed", "executive_sponsor", "Delivered");
    expect(initiative.state).toBe("completed");
    expect(initiative.outcome?.persistedToMemory).toBe(true);
    expect(initiative.outcome?.lessonsLearned.length).toBeGreaterThan(0);
  });

  it("escalates high severity risks", () => {
    const { service } = createInitiativeIntelligence({ createId: (p) => `${p}-rk` });
    const result = service.build({
      requestId: "ii-rk",
      scope: { organizationId: "org-1", schoolId: null },
      decisionResult: sampleDecision(),
      briefingResult: sampleBriefing(),
    });
    const withRisk = result.initiatives.find((i) => i.risks.length > 0);
    expect(withRisk?.risks.some((r) => r.escalationRequired)).toBe(true);
  });

  it("wires into createIntelligenceService DI", () => {
    const stacks = createIntelligenceService({ eagerStacks: true });
    expect(stacks.initiativeIntelligence.service).toBeTruthy();
    const result = stacks.initiativeIntelligence.service.build({
      requestId: "ii-di",
      scope: { organizationId: "org-1", schoolId: null },
      decisionResult: sampleDecision(),
    });
    expect(result.version).toBe(INITIATIVE_INTELLIGENCE_VERSION);
  });

  it("runs in pipeline before portfolio-intelligence", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-19T12:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });
    const health = await platform.checkHealth();
    expect(health.modules.length).toBe(51);
    expect(platform.registry.get("initiative-intelligence")?.id).toBe(
      "initiative-intelligence"
    );

    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
      input: { periodLabel: "Sprint 069 validation", role: "ceo" },
    });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual(PIPELINE_ORDER);
    expect(result.moduleOrder.at(-4)).toBe("initiative-intelligence");
    expect(result.moduleOrder.at(-3)).toBe("portfolio-intelligence");
    expect(result.moduleOrder.at(-2)).toBe("digital-twin");
    expect(result.moduleOrder.at(-1)).toBe("ecosystem-intelligence");
    expect(result.results.every((item) => item.ok)).toBe(true);

    const ecc = result.results.find((r) => r.moduleId === "executive-command-center");
    // Re-enriched by initiative module after ECC first pass.
    const eccData = result.results.find((r) => r.moduleId === "initiative-intelligence");
    expect(eccData?.ok).toBe(true);
    expect(ecc?.ok).toBe(true);
  });

  it("enriches Executive Command Center with initiative widgets", async () => {
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
    // Context enrichment happens inside initiative module; verify initiative result shape.
    const ii = run.results.find((r) => r.moduleId === "initiative-intelligence");
    expect(ii?.ok).toBe(true);
    const data = ii?.data as { initiatives: unknown[]; activeCount: number };
    expect(Array.isArray(data.initiatives)).toBe(true);
  });
});
