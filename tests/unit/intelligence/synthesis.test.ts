/** Executive Synthesis Intelligence unit tests (Sprint 061 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createSynthesisIntelligence,
  SYNTHESIS_INTELLIGENCE_VERSION,
  SYNTHESIS_MODULE_ID,
  resetSynthesisIdSeqForTests,
  type DomainSignalLight,
} from "@/lib/platform/intelligence/synthesis";
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

function staffingClusterSignals(): DomainSignalLight[] {
  return [
    {
      domain: "finance",
      score: 42,
      direction: "down",
      narrative: "Cash declining",
    },
    {
      domain: "human-capital",
      score: 38,
      direction: "down",
      narrative: "Teacher vacancies increasing",
    },
    {
      domain: "customer",
      score: 45,
      direction: "down",
      narrative: "Enrollment slowing",
    },
  ];
}

function build(seed: string, signals?: DomainSignalLight[]) {
  const { service } = createSynthesisIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-18T16:00:00.000Z"),
  });
  return service.build({
    requestId: `syn-${seed}`,
    scope: { organizationId: "org-1", schoolId: "school-1" },
    signals,
    periodLabel: "2026-Q3",
  });
}

describe("Executive Synthesis Intelligence (Sprint 061)", () => {
  beforeEach(() => {
    resetPlatformIdSeqForTests();
    resetSynthesisIdSeqForTests();
  });

  it("exports Sprint 061 version and module id", () => {
    expect(SYNTHESIS_INTELLIGENCE_VERSION).toBe("0.1.0");
    expect(SYNTHESIS_MODULE_ID).toBe("synthesis");
  });

  it("correlates cross-domain degrading signals into one finding", () => {
    const result = build("corr", staffingClusterSignals());
    expect(result.version).toBe(SYNTHESIS_INTELLIGENCE_VERSION);
    expect(result.correlations.length).toBeGreaterThan(0);
    expect(result.correlations.some((c) => c.domains.includes("human-capital"))).toBe(true);
    expect(result.insights[0]?.summary.length).toBeGreaterThan(20);
  });

  it("produces root-cause analysis with evidence, confidence, and alternatives", () => {
    const result = build("rca", staffingClusterSignals());
    const rca = result.insights[0].rootCause;
    expect(rca.likelyCause.toLowerCase()).toMatch(/staffing|financial|customer|diffuse|insufficient/);
    expect(rca.supportingEvidence.length).toBeGreaterThan(0);
    expect(rca.confidence).toBeGreaterThan(0);
    expect(rca.alternativeCauses.length).toBeGreaterThan(0);
    expect(rca.affectedDomains).toEqual(
      expect.arrayContaining(["finance", "human-capital", "customer"])
    );
  });

  it("detects contradictions between opposing signals", () => {
    const result = build("contra", [
      { domain: "revenue", score: 82, direction: "up", narrative: "Revenue up" },
      { domain: "finance", score: 35, direction: "down", narrative: "Cash down" },
      { domain: "human-capital", score: 78, direction: "up", narrative: "Satisfaction up" },
      { domain: "operations", score: 40, direction: "down", narrative: "Turnover up" },
    ]);
    expect(result.contradictions.length).toBeGreaterThan(0);
    expect(result.explainability.contradictoryEvidence.length).toBeGreaterThan(0);
  });

  it("detects opportunities alongside risks", () => {
    const result = build("opp", [
      { domain: "funding", score: 72, direction: "up", narrative: "Grant pipeline healthy" },
      { domain: "innovation", score: 68, direction: "up", narrative: "Automation runway" },
      { domain: "operations", score: 48, direction: "down", narrative: "Process friction" },
    ]);
    expect(result.opportunities.length).toBeGreaterThan(0);
    expect(result.risks.length).toBeGreaterThan(0);
  });

  it("generates recommendations with impact, effort, and dependencies", () => {
    const result = build("rec", staffingClusterSignals());
    expect(result.recommendations.length).toBeGreaterThan(0);
    const rec = result.recommendations[0];
    expect(rec.recommendedActions.length).toBeGreaterThan(0);
    expect(rec.expectedImpact.length).toBeGreaterThan(0);
    expect(["low", "medium", "high"]).toContain(rec.estimatedEffort);
    expect(rec.dependencies.length).toBeGreaterThan(0);
    expect(rec.confidence).toBeGreaterThan(0);
  });

  it("assigns standardized priority scores", () => {
    const result = build("prio", staffingClusterSignals());
    const scores = result.insights[0].scores;
    for (const key of [
      "severity",
      "urgency",
      "confidence",
      "businessImpact",
      "financialImpact",
      "operationalImpact",
      "strategicAlignment",
    ] as const) {
      expect(scores[key]).toBeGreaterThanOrEqual(0);
      expect(scores[key]).toBeLessThanOrEqual(100);
    }
    expect(["critical", "high", "medium", "low", "informational"]).toContain(scores.priority);
    expect(["immediate", "near_term", "medium_term", "long_term"]).toContain(scores.timeHorizon);
  });

  it("handles empty input without throwing", () => {
    const result = build("empty", []);
    expect(result.insights.length).toBe(1);
    expect(result.brief.executiveSummary.length).toBeGreaterThan(0);
    expect(result.correlations).toEqual([]);
    expect(result.contributingDomains).toEqual([]);
  });

  it("handles partial input from a single domain", () => {
    const result = build("partial", [
      { domain: "finance", score: 40, direction: "down", narrative: "Cash soft" },
    ]);
    expect(result.contributingDomains).toEqual(["finance"]);
    expect(result.insights[0].rootCause.affectedDomains).toContain("finance");
    expect(result.brief.id).toBeTruthy();
  });

  it("handles conflicting input with explainability", () => {
    const result = build("conflict", [
      { domain: "customer", score: 85, direction: "up", narrative: "Enrollment up" },
      { domain: "customer-retention", score: 30, direction: "down", narrative: "Retention down" },
    ]);
    expect(result.contradictions.length).toBeGreaterThan(0);
    expect(result.explainability.why.length).toBeGreaterThan(10);
    expect(result.explainability.contributingDomains.length).toBeGreaterThan(0);
  });

  it("soft-reads wisdom when provided and missing domains do not break synthesis", () => {
    const { service } = createSynthesisIntelligence({
      createId: (p) => `${p}-wis`,
      now: () => new Date("2026-07-18T16:00:00.000Z"),
    });
    const result = service.build({
      requestId: "syn-wis",
      scope: { organizationId: "org-1", schoolId: null },
      signals: [{ domain: "operations", score: 50, direction: "flat" }],
      wisdomResult: {
        healthScore: { value: 52 },
        wisdomScore: { value: 51 },
        headline: "Judgment fragile",
      },
    });
    expect(result.contributingDomains).toEqual(
      expect.arrayContaining(["operations", "wisdom"])
    );
  });

  it("produces an Executive Brief with required sections", () => {
    const result = build("brief", staffingClusterSignals());
    const brief = result.brief;
    expect(brief.version).toBe(SYNTHESIS_INTELLIGENCE_VERSION);
    expect(brief.executiveSummary.length).toBeGreaterThan(0);
    expect(Array.isArray(brief.topRisks)).toBe(true);
    expect(Array.isArray(brief.topOpportunities)).toBe(true);
    expect(Array.isArray(brief.decisionsNeeded)).toBe(true);
    expect(Array.isArray(brief.criticalAlerts)).toBe(true);
    expect(Array.isArray(brief.emergingTrends)).toBe(true);
    expect(Array.isArray(brief.crossDomainCorrelations)).toBe(true);
    expect(Array.isArray(brief.recommendedActions)).toBe(true);
    expect(brief.confidenceSummary.overall).toBeGreaterThan(0);
    expect(brief.overnightSummary?.length).toBeGreaterThan(0);
  });

  it("supports plug-in analyzer registration without engine edits", () => {
    const { engine, service } = createSynthesisIntelligence({
      createId: (p) => `${p}-plug`,
      now: () => new Date("2026-07-18T16:00:00.000Z"),
    });
    engine.registerAnalyzer({
      id: "campus-florida",
      name: "Florida Campus Analyzer",
      version: "0.1.0",
      analyze() {
        return {
          correlations: [
            {
              id: "corr-fl",
              title: "Florida campus staffing cluster",
              domains: ["human-capital", "customer"],
              strength: 0.9,
              narrative:
                "These signals strongly correlate with staffing instability at the Florida campus.",
              evidence: [],
            },
          ],
        };
      },
    });
    const result = service.build({
      requestId: "syn-plug",
      scope: { organizationId: "org-1", schoolId: "fl-1" },
      signals: staffingClusterSignals(),
    });
    expect(result.correlations.some((c) => c.id === "corr-fl")).toBe(true);
  });

  it("wires into createIntelligenceService DI", () => {
    const stacks = createIntelligenceService({ eagerStacks: true });
    expect(stacks.synthesis.service).toBeTruthy();
    const result = stacks.synthesis.service.build({
      requestId: "di-syn",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      signals: staffingClusterSignals(),
    });
    expect(result.brief.executiveSummary.length).toBeGreaterThan(0);
  });

  it("runs as the platform module after wisdom (before briefing)", async () => {
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
