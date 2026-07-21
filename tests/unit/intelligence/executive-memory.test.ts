/** Executive Memory Intelligence unit tests (Sprint 063 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createExecutiveMemoryIntelligence,
  EXECUTIVE_MEMORY_VERSION,
  EXECUTIVE_MEMORY_MODULE_ID,
  resetExecutiveMemoryIdSeqForTests,
  DEFAULT_RETENTION_RULES,
  type BriefingResultLight,
  type DecisionMemory,
} from "@/lib/platform/intelligence/executive-memory";
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
  "wisdom", "synthesis", "briefing", "executive-memory", "decision-intelligence", "executive-predictive", "executive-autonomous", "executive-copilot", "executive-command-center", "initiative-intelligence", "portfolio-intelligence", "digital-twin",
"ecosystem-intelligence",
];

function sampleBriefing(): BriefingResultLight {
  return {
    requestId: "br-1",
    generatedAt: "2026-07-18T08:00:00.000Z",
    healthScore: { value: 52, label: "watch" },
    contributingDomains: ["finance", "human-capital", "customer"],
    briefing: {
      id: "brief-1",
      greeting: "Good Morning, Jimmy",
      sections: {
        executiveSummary: "Staffing instability is elevating enrollment risk.",
        topRisks: [
          {
            id: "r1",
            title: "Staffing–cash cluster",
            summary: "Vacancies and cash decline co-move.",
            severity: 82,
            urgency: 78,
            confidence: 0.74,
            domains: ["finance", "human-capital"],
            status: "elevated",
          },
        ],
        topOpportunities: [
          {
            id: "o1",
            title: "Retention incentive window",
            summary: "Targeted retention can stabilize enrollment.",
            category: "hiring",
            estimatedImpact: 76,
            confidence: 0.68,
            domains: ["human-capital", "customer"],
          },
        ],
        decisionsWaiting: [
          {
            id: "d1",
            title: "Staffing war-room",
            decisionNeeded: "Approve Florida staffing war-room",
            why: "Cross-domain degradation requires coordinated action",
            recommendedDecision: "Approve 30-day war-room with owner",
            impactIfDelayed: "Enrollment risk compounds",
            confidence: 0.72,
            domains: ["human-capital", "customer", "finance"],
          },
        ],
      },
      explainability: {
        why: "Brief derived from synthesis staffing cluster",
        contributingDomains: ["finance", "human-capital", "customer"],
        confidence: 70,
      },
    },
    overnight: {
      summary: "Overnight: staffing and cash signals degraded together.",
      newRisks: ["Teacher vacancy spike"],
      resolvedRisks: [],
      newOpportunities: ["Grant timing window"],
      financialMovement: ["Cash declining"],
      staffingChanges: ["Vacancies up"],
      fundingUpdates: [],
      strategicChanges: [],
    },
    decisionQueue: [
      {
        id: "d1",
        title: "Staffing war-room",
        decisionNeeded: "Approve Florida staffing war-room",
        why: "Cross-domain degradation requires coordinated action",
        recommendedDecision: "Approve 30-day war-room with owner",
        impactIfDelayed: "Enrollment risk compounds",
        confidence: 0.72,
        domains: ["human-capital", "customer", "finance"],
      },
    ],
    opportunityQueue: [
      {
        id: "o1",
        title: "Retention incentive window",
        summary: "Targeted retention can stabilize enrollment.",
        category: "hiring",
        estimatedImpact: 76,
        confidence: 0.68,
        domains: ["human-capital", "customer"],
      },
    ],
  };
}

function build(seed: string, briefing?: BriefingResultLight) {
  const { service } = createExecutiveMemoryIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-18T16:00:00.000Z"),
  });
  return service.build({
    requestId: `mem-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    briefingResult: briefing,
    periodLabel: "daily",
  });
}

describe("Executive Memory Intelligence (Sprint 063)", () => {
  beforeEach(() => {
    resetPlatformIdSeqForTests();
    resetExecutiveMemoryIdSeqForTests();
  });

  it("exports Sprint 063 version and module id", () => {
    expect(EXECUTIVE_MEMORY_VERSION).toBe("0.1.0");
    expect(EXECUTIVE_MEMORY_MODULE_ID).toBe("executive-memory");
  });

  it("persists decisions from briefing decision queue", () => {
    const result = build("dec", sampleBriefing());
    expect(result.decisions.length).toBeGreaterThan(0);
    expect(result.decisions[0].decision).toMatch(/war-room|Approve/i);
    expect(result.decisions[0].status).toBe("proposed");
  });

  it("archives executive briefs for comparison", () => {
    const result = build("arc", sampleBriefing());
    expect(result.archive.length).toBeGreaterThan(0);
    expect(result.archive[0].period).toBe("daily");
    expect(result.archive[0].executiveSummary.length).toBeGreaterThan(10);
  });

  it("builds an organizational timeline", () => {
    const result = build("tl", sampleBriefing());
    expect(result.timeline.length).toBeGreaterThan(0);
    expect(result.timeline.every((e) => e.at && e.entityId)).toBe(true);
  });

  it("builds a relationship graph without duplicate entities", () => {
    const { service, engine } = createExecutiveMemoryIntelligence({
      createId: (p) => `${p}-dup`,
      now: () => new Date("2026-07-18T16:00:00.000Z"),
    });
    const briefing = sampleBriefing();
    service.build({
      requestId: "mem-dup-1",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      briefingResult: briefing,
    });
    service.build({
      requestId: "mem-dup-2",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      briefingResult: briefing,
    });
    const risks = engine.graph.listEntities().filter((e) => e.kind === "risk");
    const staffing = risks.filter((e) => e.kind === "risk" && e.title === "Staffing–cash cluster");
    expect(staffing.length).toBe(1);
    expect(staffing[0]?.kind).toBe("risk");
    if (staffing[0]?.kind === "risk") {
      expect(staffing[0].recurrenceCount).toBeGreaterThanOrEqual(2);
    }
    expect(engine.graph.listRelationships().length).toBeGreaterThan(0);
  });

  it("supports retrieval filters by domain and topic", () => {
    const { service } = createExecutiveMemoryIntelligence({
      createId: (p) => `${p}-ret`,
      now: () => new Date("2026-07-18T16:00:00.000Z"),
    });
    service.build({
      requestId: "mem-ret",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      briefingResult: sampleBriefing(),
    });
    const recall = service.recall({
      domains: ["human-capital"],
      text: "staffing",
      organizationId: "org-1",
    });
    expect(recall.entities.length).toBeGreaterThan(0);
    expect(recall.answers.length).toBeGreaterThan(0);
  });

  it("records lessons learned from decision outcomes", () => {
    const { service, engine } = createExecutiveMemoryIntelligence({
      createId: (p) => `${p}-les`,
      now: () => new Date("2026-07-18T16:00:00.000Z"),
    });
    const decision: DecisionMemory = {
      id: "decision-manual",
      kind: "decision",
      title: "Hire cohort",
      summary: "Approved emergency hiring",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      domains: ["human-capital"],
      tags: ["decision"],
      confidence: 0.8,
      evidence: [],
      retention: "permanent",
      sourceIds: ["src-hire"],
      metadata: {},
      decision: "Approve emergency hiring",
      alternatives: ["Delay hiring"],
      expectedOutcome: "Vacancies filled in 30 days",
      actualOutcome: "Vacancies filled in 45 days",
      status: "completed",
    };
    const result = service.build({
      requestId: "mem-les",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      entities: [decision],
    });
    expect(result.lessons.length).toBeGreaterThan(0);
    expect(result.lessons[0].change.length).toBeGreaterThan(0);
    expect(engine.retrieval.traverseFrom(decision.id).length).toBeGreaterThan(0);
  });

  it("applies configurable retention policies", () => {
    const result = build("retpol", sampleBriefing());
    expect(result.retentionApplied.length).toBeGreaterThan(0);
    expect(DEFAULT_RETENTION_RULES.some((r) => r.policy === "permanent")).toBe(true);
    const decisions = result.stored.filter((e) => e.kind === "decision");
    expect(decisions.every((d) => d.retention === "permanent")).toBe(true);
  });

  it("handles empty memory without throwing", () => {
    const result = build("empty");
    expect(result.stored).toEqual([]);
    expect(result.timeline).toEqual([]);
    expect(result.decisions).toEqual([]);
    expect(result.healthScore.label).toBe("sparse");
  });

  it("supports executive recall structured answers", () => {
    const { service } = createExecutiveMemoryIntelligence({
      createId: (p) => `${p}-rec`,
      now: () => new Date("2026-07-18T16:00:00.000Z"),
    });
    service.build({
      requestId: "mem-rec",
      scope: { organizationId: "org-1", schoolId: null },
      briefingResult: sampleBriefing(),
    });
    const when = service.recall({ text: "when did this risk first appear", kinds: ["risk"] });
    expect(when.answers.some((a) => a.toLowerCase().includes("first appeared"))).toBe(true);
    const briefs = service.engine.retrieval.briefingsRelatedTo("staffing");
    expect(briefs.length).toBeGreaterThan(0);
  });

  it("wires into createIntelligenceService DI", () => {
    const stacks = createIntelligenceService({ eagerStacks: true });
    expect(stacks.executiveMemory.service).toBeTruthy();
    const result = stacks.executiveMemory.service.build({
      requestId: "di-mem",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      briefingResult: sampleBriefing(),
    });
    expect(result.version).toBe(EXECUTIVE_MEMORY_VERSION);
  });

  it("runs as terminal pipeline module after briefing", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-18T16:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });
    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
    });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual(PIPELINE_ORDER);
    expect(result.moduleOrder.at(-13)).toBe("wisdom");
    expect(result.moduleOrder.at(-12)).toBe("synthesis");
    expect(result.moduleOrder.at(-11)).toBe("briefing");
    expect(result.moduleOrder.at(-10)).toBe("executive-memory");
    expect(result.moduleOrder.at(-9)).toBe("decision-intelligence");
    expect(result.moduleOrder.at(-8)).toBe("executive-predictive");
    expect(result.moduleOrder.at(-7)).toBe("executive-autonomous");
    expect(result.moduleOrder.at(-6)).toBe("executive-copilot");
    expect(result.moduleOrder.at(-5)).toBe("executive-command-center");
    expect(result.moduleOrder.at(-4)).toBe("initiative-intelligence");
    expect(result.moduleOrder.at(-3)).toBe("portfolio-intelligence");
    expect(result.moduleOrder.at(-2)).toBe("digital-twin");
    expect(result.moduleOrder.at(-1)).toBe("ecosystem-intelligence");
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
