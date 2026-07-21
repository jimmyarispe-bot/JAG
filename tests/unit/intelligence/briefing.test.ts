/** Executive Briefing Intelligence unit tests (Sprint 062 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createBriefingIntelligence,
  BRIEFING_INTELLIGENCE_VERSION,
  BRIEFING_MODULE_ID,
  resetBriefingIdSeqForTests,
  sortByPriority,
  type BriefingCard,
  type SynthesisResultLight,
} from "@/lib/platform/intelligence/briefing";
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

function sampleSynthesis(): SynthesisResultLight {
  return {
    requestId: "syn-1",
    healthScore: { value: 48, label: "watch" },
    contributingDomains: ["finance", "human-capital", "customer"],
    brief: {
      executiveSummary:
        "Staffing instability correlates with cash pressure and enrollment risk.",
      overnightSummary: "Overnight: staffing and cash signals degraded together.",
      topRisks: [
        {
          id: "r1",
          title: "Staffing–cash cluster",
          narrative: "Teacher vacancies and cash decline co-move.",
          severity: 82,
          urgency: 78,
          domains: ["finance", "human-capital"],
          confidence: 0.74,
        },
      ],
      topOpportunities: [
        {
          id: "o1",
          title: "Retention incentive window",
          category: "staffing",
          narrative: "Targeted retention can stabilize enrollment.",
          estimatedImpact: 76,
          confidence: 0.68,
          domains: ["human-capital", "customer"],
        },
      ],
      decisionsNeeded: ["Stand up staffing war-room for Florida campus"],
      criticalAlerts: ["Executive attention required on staffing cluster"],
      recommendedActions: [
        "Brief CEO within 24 hours",
        "Launch parent confidence outreach",
      ],
      confidenceSummary: { overall: 68, byDomain: { finance: 42, "human-capital": 38 } },
    },
    insights: [
      {
        id: "i1",
        title: "Cross-domain staffing narrative",
        summary: "Staffing instability is the shared driver.",
        scores: {
          severity: 80,
          urgency: 75,
          confidence: 70,
          businessImpact: 78,
          financialImpact: 72,
          operationalImpact: 80,
          strategicAlignment: 66,
          priority: "high",
        },
        rootCause: {
          likelyCause: "Staffing instability linking continuity and enrollment",
          confidence: 0.72,
          affectedDomains: ["finance", "human-capital", "customer"],
          supportingEvidence: [
            {
              id: "e1",
              domain: "human-capital",
              statement: "Vacancies rising",
              weight: 0.8,
              supporting: true,
            },
          ],
        },
        explainability: {
          why: "Correlated degrading signals across three domains.",
          contributingDomains: ["finance", "human-capital", "customer"],
          confidence: 70,
          supportingEvidence: [],
        },
      },
    ],
    explainability: {
      why: "Synthesis correlated finance, HR, and customer signals.",
      contributingDomains: ["finance", "human-capital", "customer"],
      confidence: 70,
      supportingEvidence: [],
    },
  };
}

function build(seed: string, overrides: Partial<Parameters<ReturnType<typeof createBriefingIntelligence>["service"]["build"]>[0]> = {}) {
  const { service } = createBriefingIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-18T16:00:00.000Z"),
  });
  return service.build({
    requestId: `br-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    greetingName: "Jimmy",
    role: "founder",
    synthesisResult: sampleSynthesis(),
    ...overrides,
  });
}

describe("Executive Briefing Intelligence (Sprint 062)", () => {
  beforeEach(() => {
    resetPlatformIdSeqForTests();
    resetBriefingIdSeqForTests();
  });

  it("exports Sprint 062 version and module id", () => {
    expect(BRIEFING_INTELLIGENCE_VERSION).toBe("0.1.0");
    expect(BRIEFING_MODULE_ID).toBe("briefing");
  });

  it("generates a complete morning brief", () => {
    const result = build("full");
    expect(result.version).toBe(BRIEFING_INTELLIGENCE_VERSION);
    expect(result.briefing.greeting).toContain("Jimmy");
    expect(result.briefing.sections.executiveSummary.length).toBeGreaterThan(10);
    expect(result.briefing.sections.topRisks.length).toBeGreaterThan(0);
    expect(result.briefing.sections.topOpportunities.length).toBeGreaterThan(0);
    expect(result.briefing.sections.decisionsWaiting.length).toBeGreaterThan(0);
    expect(result.briefing.sections.todaysFocus.length).toBeGreaterThan(0);
    expect(result.briefing.sections.recommendedActions.length).toBeGreaterThan(0);
  });

  it("handles empty brief without throwing", () => {
    const result = build("empty", { synthesisResult: undefined });
    expect(result.briefing.sections.executiveSummary.length).toBeGreaterThan(0);
    expect(result.briefing.sections.topRisks).toEqual([]);
    expect(result.overnight.summary.length).toBeGreaterThan(0);
  });

  it("orders cards by priority scores rather than chronology", () => {
    const cards: BriefingCard[] = [
      {
        id: "low",
        kind: "risk",
        title: "Low",
        summary: "Low",
        priorityScore: 40,
        severity: 40,
        urgency: 40,
        confidence: 40,
        businessImpact: 40,
        strategicAlignment: 40,
        domains: [],
        explainability: { why: "x", contributingDomains: [], confidence: 40, supportingEvidence: [] },
        actions: [],
      },
      {
        id: "high",
        kind: "risk",
        title: "High",
        summary: "High",
        priorityScore: 90,
        severity: 90,
        urgency: 90,
        confidence: 80,
        businessImpact: 85,
        strategicAlignment: 70,
        domains: [],
        explainability: { why: "x", contributingDomains: [], confidence: 80, supportingEvidence: [] },
        actions: [],
      },
    ];
    expect(sortByPriority(cards).map((c) => c.id)).toEqual(["high", "low"]);
    const result = build("prio");
    const scores = result.briefing.cards.map((c) => c.priorityScore);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });

  it("builds overnight intelligence summaries", () => {
    const result = build("overnight");
    expect(result.overnight.newRisks.length).toBeGreaterThan(0);
    expect(result.overnight.newOpportunities.length).toBeGreaterThan(0);
    expect(result.overnight.staffingChanges.length).toBeGreaterThan(0);
    expect(result.overnight.financialMovement.length).toBeGreaterThan(0);
  });

  it("generates a decision queue with explainability fields", () => {
    const result = build("decisions");
    const decision = result.decisionQueue[0];
    expect(decision.kind).toBe("decision");
    expect(decision.decisionNeeded.length).toBeGreaterThan(0);
    expect(decision.why.length).toBeGreaterThan(0);
    expect(decision.impactIfDelayed.length).toBeGreaterThan(0);
    expect(decision.recommendedDecision.length).toBeGreaterThan(0);
    expect(decision.explainability.why.length).toBeGreaterThan(0);
    expect(decision.actions.length).toBeGreaterThan(0);
  });

  it("generates an opportunity queue", () => {
    const result = build("opps");
    expect(result.opportunityQueue.length).toBeGreaterThan(0);
    expect(result.opportunityQueue[0].category).toBeTruthy();
    expect(result.opportunityQueue[0].actions.some((a) => a.id === "create_initiative")).toBe(true);
  });

  it("personalizes for founder vs board", () => {
    const founder = build("founder", { role: "founder", greetingName: "Jimmy" });
    const board = build("board", { role: "board", greetingName: "Directors" });
    expect(founder.briefing.greeting).toMatch(/Jimmy/);
    expect(board.briefing.greeting).toMatch(/Board Briefing/);
    expect(board.briefing.role).toBe("board");
    expect(founder.briefing.metadata.personalization).toBe("founder");
  });

  it("includes explainability on every card", () => {
    const result = build("explain");
    for (const card of result.briefing.cards) {
      expect(card.explainability.why.length).toBeGreaterThan(5);
      expect(card.explainability.confidence).toBeGreaterThanOrEqual(0);
      expect(card.actions.length).toBeGreaterThan(0);
    }
  });

  it("handles partial data", () => {
    const result = build("partial", {
      synthesisResult: {
        healthScore: { value: 62 },
        brief: { executiveSummary: "Partial synthesis only." },
      },
    });
    expect(result.briefing.sections.executiveSummary).toContain("Partial");
    expect(result.briefing.sections.organizationHealth?.value).toBe(62);
  });

  it("handles missing domains gracefully", () => {
    const result = build("missing", {
      synthesisResult: {
        brief: {
          topRisks: [{ title: "Orphan risk", severity: 70, urgency: 60 }],
          decisionsNeeded: ["Decide without domain tags"],
        },
      },
    });
    expect(result.decisionQueue.length).toBeGreaterThan(0);
    expect(result.briefing.sections.topRisks[0].domains).toEqual([]);
  });

  it("builds executive timeline windows", () => {
    const result = build("timeline");
    const windows = result.timeline.map((t) => t.window);
    expect(windows).toEqual(
      expect.arrayContaining([
        "today",
        "yesterday",
        "last_7_days",
        "last_30_days",
        "quarter",
        "year",
      ])
    );
  });

  it("supports plug-in personalizers", () => {
    const { engine, service } = createBriefingIntelligence({
      createId: (p) => `${p}-plug`,
      now: () => new Date("2026-07-18T16:00:00.000Z"),
    });
    engine.registerPersonalizer({
      id: "cfo",
      name: "CFO",
      version: "0.1.0",
      personalize(briefing) {
        return {
          ...briefing,
          greeting: "CFO Brief Ready",
          metadata: { ...briefing.metadata, personalization: "cfo" },
        };
      },
    });
    const result = service.build({
      requestId: "br-cfo",
      scope: { organizationId: "org-1", schoolId: null },
      role: "executive",
      preferences: { role: "executive" },
      synthesisResult: sampleSynthesis(),
    });
    // executive personalizer still applies by role; register under executive override test:
    engine.registerPersonalizer({
      id: "executive",
      name: "Override",
      version: "0.1.0",
      personalize(briefing) {
        return { ...briefing, greeting: "CFO Brief Ready", metadata: { ...briefing.metadata, personalization: "cfo" } };
      },
    });
    const overridden = service.build({
      requestId: "br-cfo-2",
      scope: { organizationId: "org-1", schoolId: null },
      role: "executive",
      synthesisResult: sampleSynthesis(),
    });
    expect(overridden.briefing.greeting).toBe("CFO Brief Ready");
    expect(result.briefing.version).toBe(BRIEFING_INTELLIGENCE_VERSION);
  });

  it("wires into createIntelligenceService DI", () => {
    const stacks = createIntelligenceService({ eagerStacks: true });
    expect(stacks.briefing.service).toBeTruthy();
    const result = stacks.briefing.service.build({
      requestId: "di-br",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      greetingName: "Jimmy",
      synthesisResult: sampleSynthesis(),
    });
    expect(result.briefing.sections.greeting).toContain("Jimmy");
  });

  it("runs as terminal pipeline module after synthesis", async () => {
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
