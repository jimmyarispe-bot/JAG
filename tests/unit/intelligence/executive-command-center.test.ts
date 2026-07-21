/** Executive Command Center unit tests (Sprint 068 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createExecutiveCommandCenter,
  EXECUTIVE_COMMAND_CENTER_VERSION,
  EXECUTIVE_COMMAND_CENTER_MODULE_ID,
  listLayouts,
  getLayoutForRole,
  DEFAULT_DRILL_DOWNS,
  drillDownLabel,
  type BriefingResultLight,
  type DecisionIntelligenceResultLight,
  type ExecutivePredictiveResultLight,
  type AutonomousResultLight,
  type CopilotResultLight,
} from "@/lib/platform/intelligence/executive-command-center";
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

function sampleBriefing(): BriefingResultLight {
  return {
    healthScore: { value: 62, label: "watch" },
    contributingDomains: ["briefing"],
    briefing: {
      sections: {
        executiveSummary: "Florida enrollment and staffing remain coupled risks.",
        topRisks: [
          {
            id: "r1",
            title: "Enrollment decline",
            summary: "Conversion softening in Florida",
            severity: 78,
            domains: ["enrollment"],
          },
        ],
        topOpportunities: [
          {
            id: "o1",
            title: "Campaign reactivation",
            summary: "High-intent inquiry segment",
            estimatedImpact: 70,
          },
        ],
      },
    },
    decisionQueue: [{ id: "dq1", title: "Staffing war-room", decisionNeeded: "Address vacancies" }],
  };
}

function sampleDecision(): DecisionIntelligenceResultLight {
  return {
    contributingDomains: ["decision-intelligence"],
    recommendation: {
      id: "rec-1",
      executiveSummary: "Prioritize temporary hiring.",
      rankedOptions: [
        {
          id: "opt-a",
          title: "Hire temporary teachers",
          summary: "Bridge capacity",
          category: "staffing",
          confidence: 0.8,
          scorecard: { overall: 82, roi: 88 },
        },
      ],
    },
  };
}

function samplePredictive(): ExecutivePredictiveResultLight {
  return {
    contributingDomains: ["executive-predictive"],
    forecasts: [
      { subject: "enrollment", horizon: "90d", direction: "degrading", confidence: 0.6 },
    ],
    emergingSignals: [
      { title: "Conversion softening", subject: "enrollment", narrative: "Funnel decline", strength: 0.55 },
    ],
  };
}

function sampleAutonomous(): AutonomousResultLight {
  return {
    contributingDomains: ["executive-autonomous"],
    autoExecute: false,
    plans: [
      {
        id: "plan-1",
        workflowKind: "staffing",
        optionTitle: "Hire temporary teachers",
        readiness: "waiting_approval",
        humanAuthorizationRequired: true,
        autoExecute: false,
      },
    ],
    approvalQueue: [
      { role: "executive_director", status: "pending", rationale: "Staffing approval required" },
    ],
  };
}

function sampleCopilot(): CopilotResultLight {
  return {
    contributingDomains: ["executive-copilot"],
    intent: "summarize",
    answer: "Staffing and enrollment risks are co-moving.",
    explainability: {
      executiveSummary: "Staffing and enrollment risks are co-moving.",
      confidence: 0.72,
      contributingDomains: ["briefing", "decision-intelligence"],
    },
    followUps: [{ prompt: "Investigate enrollment decline", intent: "investigate" }],
  };
}

describe("Executive Command Center (Sprint 068)", () => {
  beforeEach(() => {
    resetPlatformIdSeqForTests();
  });

  it("exports Sprint 068 version and module id", () => {
    expect(EXECUTIVE_COMMAND_CENTER_VERSION).toBe("0.1.0");
    expect(EXECUTIVE_COMMAND_CENTER_MODULE_ID).toBe("executive-command-center");
  });

  it("provides role layouts for founder, CEO, board, and school leader", () => {
    const layouts = listLayouts();
    expect(layouts.map((l) => l.role).sort()).toEqual(
      ["board", "ceo", "founder", "mission_control", "school_leader"].sort()
    );
    expect(getLayoutForRole("founder").widgetOrder[0]).toBe("health");
    expect(getLayoutForRole("ceo").widgetOrder[0]).toBe("mission_control_summary");
    expect(getLayoutForRole("mission_control").widgetOrder[0]).toBe(
      "mission_control_summary"
    );
    expect(getLayoutForRole("board").widgetOrder[0]).toBe("risks");
    expect(getLayoutForRole("school_leader").widgetOrder[0]).toBe("risks");
  });

  it("builds a single workspace with domain-projected widgets", () => {
    const { service } = createExecutiveCommandCenter({
      createId: (p) => `${p}-ws`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.build({
      requestId: "ecc-1",
      scope: { organizationId: "org-1", schoolId: "fl-1" },
      role: "ceo",
      briefingResult: sampleBriefing(),
      decisionResult: sampleDecision(),
      predictiveResult: samplePredictive(),
      autonomousResult: sampleAutonomous(),
      copilotResult: sampleCopilot(),
    });
    expect(result.widgets.length).toBe(getLayoutForRole("ceo").widgetOrder.length);
    expect(result.widgets.every((w) => w.sourceDomain.length > 0)).toBe(true);
    expect(result.metadata.duplicatesDomainLogic).toBe(false);
    const risks = result.widgets.find((w) => w.kind === "risks");
    expect(risks?.cards[0]?.title).toMatch(/Enrollment/i);
  });

  it("prioritizes widgets differently by role without changing the platform", () => {
    const { service } = createExecutiveCommandCenter({ createId: (p) => `${p}-role` });
    const base = {
      requestId: "ecc-role",
      scope: { organizationId: "org-1", schoolId: null as string | null },
      briefingResult: sampleBriefing(),
      decisionResult: sampleDecision(),
    };
    const founder = service.build({ ...base, role: "founder" });
    const board = service.build({ ...base, role: "board" });
    expect(founder.widgets[0].kind).toBe("health");
    expect(board.widgets[0].kind).toBe("risks");
    expect(founder.widgets.map((w) => w.kind).sort()).toEqual(
      board.widgets.map((w) => w.kind).sort()
    );
  });

  it("refreshes from the intelligence pipeline metadata", () => {
    const { service } = createExecutiveCommandCenter({
      createId: (p) => `${p}-rf`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.refresh({
      requestId: "ecc-rf",
      scope: { organizationId: "org-1", schoolId: null },
      briefingResult: sampleBriefing(),
    });
    expect(result.refresh.source).toBe("intelligence-pipeline");
    expect(result.refresh.refreshedAt).toBe("2026-07-19T12:00:00.000Z");
    expect(result.refresh.contributingDomains).toContain("briefing");
  });

  it("attaches standardized drill-down actions to every widget", () => {
    const { service } = createExecutiveCommandCenter({ createId: (p) => `${p}-dd` });
    const result = service.build({
      requestId: "ecc-dd",
      scope: { organizationId: "org-1", schoolId: null },
      briefingResult: sampleBriefing(),
      decisionResult: sampleDecision(),
    });
    for (const widget of result.widgets) {
      expect(widget.actions).toEqual(expect.arrayContaining([...DEFAULT_DRILL_DOWNS]));
      expect(new Set(widget.actions).size).toBe(DEFAULT_DRILL_DOWNS.length);
    }
    expect(drillDownLabel("open_investigation")).toBe("Open Investigation");
    expect(drillDownLabel("create_initiative")).toBe("Create Initiative");
  });

  it("projects Autonomous plans without enabling auto-execute", () => {
    const { service } = createExecutiveCommandCenter({ createId: (p) => `${p}-plan` });
    const result = service.build({
      requestId: "ecc-plan",
      scope: { organizationId: "org-1", schoolId: null },
      autonomousResult: sampleAutonomous(),
      role: "school_leader",
    });
    const plans = result.widgets.find((w) => w.kind === "plans");
    expect(plans?.cards[0]?.meta?.autoExecute).toBe(false);
    expect(plans?.cards[0]?.summary).toMatch(/human auth/i);
  });

  it("handles empty upstream context", () => {
    const { service } = createExecutiveCommandCenter({ createId: (p) => `${p}-empty` });
    const result = service.build({
      requestId: "ecc-empty",
      scope: { organizationId: null, schoolId: null },
      role: "ceo",
    });
    expect(result.widgets.length).toBeGreaterThan(0);
    expect(result.widgets.every((w) => w.cards.length === 0 || w.emptyMessage)).toBeTruthy();
  });

  it("wires into createIntelligenceService DI", () => {
    const stacks = createIntelligenceService({ eagerStacks: true });
    expect(stacks.executiveCommandCenter.service).toBeTruthy();
    const result = stacks.executiveCommandCenter.service.build({
      requestId: "ecc-di",
      scope: { organizationId: "org-1", schoolId: null },
      briefingResult: sampleBriefing(),
    });
    expect(result.version).toBe(EXECUTIVE_COMMAND_CENTER_VERSION);
  });

  it("runs in pipeline before initiative-intelligence", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-19T12:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });
    const health = await platform.checkHealth();
    expect(health.modules.length).toBe(51);
    expect(platform.registry.get("executive-command-center")?.id).toBe(
      "executive-command-center"
    );

    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
      input: { periodLabel: "Sprint 068 validation", role: "ceo" },
    });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual(PIPELINE_ORDER);
    expect(result.moduleOrder.at(-5)).toBe("executive-command-center");
    expect(result.moduleOrder.at(-4)).toBe("initiative-intelligence");
    expect(result.moduleOrder.at(-3)).toBe("portfolio-intelligence");
    expect(result.moduleOrder.at(-2)).toBe("digital-twin");
    expect(result.moduleOrder.at(-1)).toBe("ecosystem-intelligence");
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
