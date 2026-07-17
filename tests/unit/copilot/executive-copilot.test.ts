/**
 * Executive Copilot — unit tests (Sprint E1).
 * Pure composition tests: no intelligence package or connector mutations.
 */

import { describe, expect, it } from "vitest";
import {
  askCopilot,
  buildEvidenceChainFromContext,
  buildMorningBrief,
  buildSimulationResult,
  createSessionMemory,
  matchScenarioKind,
  primaryRecommendation,
  recommendationFromWisdom,
  resolveScenarioDefinition,
  routeIntent,
  runConversation,
  type CopilotContext,
} from "@/lib/platform/copilot";

function mockContext(overrides?: Partial<CopilotContext>): CopilotContext {
  return {
    organizationId: "exec-demo-org",
    executiveRole: "CEO",
    generatedAt: "2026-07-13T12:00:00.000Z",
    dataMode: "cached",
    connectors: [
      {
        system: "academyos",
        connected: true,
        syncedAt: "2026-07-13T11:00:00.000Z",
        bullets: ["AcademyOS sync active — 120 students."],
        metrics: [
          { key: "students", label: "Students", value: 120 },
          { key: "workforceScore", label: "Workforce score", value: 78 },
        ],
      },
      {
        system: "quickbooks",
        connected: true,
        syncedAt: "2026-07-13T11:00:00.000Z",
        bullets: ["QuickBooks cash $250,000 · AR $40,000."],
        metrics: [
          { key: "cash", label: "QB cash", value: 250000 },
          { key: "revenue", label: "Revenue actual", value: 900000 },
        ],
      },
      {
        system: "square",
        connected: true,
        syncedAt: "2026-07-13T11:00:00.000Z",
        bullets: ["Square payment volume $12,000."],
        metrics: [{ key: "volume7d", label: "Payment volume 7d ($)", value: 12000 }],
      },
      {
        system: "plaid",
        connected: true,
        syncedAt: "2026-07-13T11:00:00.000Z",
        bullets: ["Plaid available cash $180,000 · burn $40,000."],
        metrics: [
          { key: "availableCash", label: "Available cash", value: 180000 },
          { key: "burn", label: "Burn (monthly)", value: 40000 },
        ],
      },
      {
        system: "google-workspace",
        connected: true,
        syncedAt: "2026-07-13T11:00:00.000Z",
        bullets: ["Next: Board prep (tomorrow).", "3 open tasks."],
        metrics: [
          { key: "upcomingMeetings", label: "Upcoming meetings", value: 4 },
          { key: "openTasks", label: "Open tasks", value: 3 },
        ],
      },
    ],
    intelligence: {
      domainsUsed: ["wisdom", "oios-core", "opportunity", "predictive"],
      wisdomHeadline: "Prioritize cash collections and enrollment pace.",
      wisdomOutlook: "stable",
      opportunityHeadlines: ["Expand summer enrollment", "Improve AR collections"],
      riskHeadlines: ["Cash runway pressure", "Staffing coverage gap"],
      predictiveHeadline: "90-day outlook: monitor cash and admissions",
      judgment: {
        whatLeadershipShouldDo: "Accelerate collections and defer non-critical hiring.",
        why: "Cash available is below operating target relative to burn.",
        whyNow: "Board meeting is this week and runway is tightening.",
        whyNotAlternatives: "Across-the-board cuts would harm mission; delay only non-critical roles.",
        risksRemaining: "Enrollment softness could extend cash pressure.",
        assumptions: "Plaid and QuickBooks syncs are current.",
        evidence: "Plaid available cash + QuickBooks AR overdue signals.",
        expectedOutcome: "Improved 30-day liquidity without mission damage.",
      },
      recommendations: [
        {
          id: "rec-1",
          title: "Accelerate collections",
          action: "Assign AR owner and clear overdue invoices this week.",
          rationale: "Overdue AR is tying up working capital.",
          narrative: "Collections sprint improves cash within 14 days.",
          priority: "high",
          confidenceScore: 0.82,
          evidenceRefs: ["plaid:cash", "qb:ar"],
          lenses: {
            strategicValue: "Protects runway for academic operations.",
            longTermImpact: "Builds institutional discipline on cash.",
            confidenceLevel: "high",
            evidenceQuality: "Multi-system cash evidence.",
            tradeOffBalance: "Focus on collections vs new spend.",
            organizationalAlignment: "Aligned with board liquidity priority.",
            ethicalIntegrity: "Fair collection practices assumed.",
            wisdomScore: "Act this week before board.",
          },
        },
        {
          id: "rec-2",
          title: "Defer non-critical hiring",
          action: "Pause two open roles for 30 days.",
          rationale: "Payroll relief while collections catch up.",
          narrative: "Hiring delay preserves cash.",
          priority: "medium",
          confidenceScore: 0.7,
          evidenceRefs: ["academyos:workforce"],
          lenses: {
            strategicValue: "Short-term cash protection.",
            longTermImpact: "Capacity risk if extended.",
            confidenceLevel: "medium",
            evidenceQuality: "Workforce + cash signals.",
            tradeOffBalance: "Cash vs capacity.",
            organizationalAlignment: "Temporary measure.",
            ethicalIntegrity: "Transparent communication required.",
            wisdomScore: "Revisit in 30 days.",
          },
        },
      ],
    },
    ...overrides,
  };
}

describe("routeIntent", () => {
  it("routes executive conversation modes", () => {
    expect(routeIntent("Daily brief")).toBe("daily_brief");
    expect(routeIntent("Why is cash down this month?")).toBe("why");
    expect(routeIntent("Why not hire now?")).toBe("why_not");
    expect(routeIntent("Show evidence")).toBe("show_evidence");
    expect(routeIntent("Explain the top recommendation")).toBe("explain_recommendation");
    expect(routeIntent("What happens if we raise tuition 5%?")).toBe("decision_simulator");
    expect(routeIntent("Compare options")).toBe("compare_options");
    expect(routeIntent("Prepare board meeting")).toBe("prepare_board_meeting");
    expect(routeIntent("Summarize this week")).toBe("summarize_week");
    expect(routeIntent("What changed?")).toBe("what_changed");
  });
});

describe("evidence chain", () => {
  it("orders AcademyOS → … → Recommendation and marks grounded systems", () => {
    const ctx = mockContext();
    const chain = buildEvidenceChainFromContext(
      ctx,
      "Accelerate collections",
      "Assign AR owner",
      "Cash pressure from burn vs available"
    );
    expect(chain.links.map((l) => l.system)).toEqual([
      "academyos",
      "quickbooks",
      "square",
      "plaid",
      "google-workspace",
      "intelligence-domains",
      "reasoning",
      "recommendation",
    ]);
    expect(chain.groundedCount).toBeGreaterThanOrEqual(6);
    expect(chain.links.every((l) => l.statement.length > 0)).toBe(true);
  });

  it("does not hallucinate disconnected systems as grounded", () => {
    const ctx = mockContext({
      connectors: mockContext().connectors.map((c) =>
        c.system === "plaid"
          ? { ...c, connected: false, bullets: [], metrics: [], syncedAt: null }
          : c
      ),
    });
    const chain = buildEvidenceChainFromContext(ctx, "Test", "Act");
    const plaid = chain.links.find((l) => l.system === "plaid");
    expect(plaid?.grounded).toBe(false);
    expect(plaid?.statement).toMatch(/not available/i);
  });
});

describe("recommendation framework", () => {
  it("answers the eight leadership questions", () => {
    const rec = primaryRecommendation(mockContext());
    expect(rec).not.toBeNull();
    expect(rec!.reasoning.whatHappened).toBeTruthy();
    expect(rec!.reasoning.whyItHappened).toBeTruthy();
    expect(rec!.reasoning.whyItMatters).toBeTruthy();
    expect(rec!.reasoning.whatShouldIDo).toBeTruthy();
    expect(rec!.reasoning.whyNow).toBeTruthy();
    expect(rec!.reasoning.alternatives.length).toBeGreaterThan(0);
    expect(rec!.reasoning.risks.length).toBeGreaterThan(0);
    expect(rec!.confidence.level).toBe("high");
    expect(rec!.explainability.evidence.length).toBeGreaterThan(0);
    expect(rec!.financialImpact).toMatch(/Cash|Financial|cash/i);
  });
});

describe("conversation engine", () => {
  it("answers cash questions with finance connector evidence", () => {
    const turn = runConversation(mockContext(), {
      question: "Why is cash down this month?",
    });
    expect(turn.intent).toBe("why");
    expect(turn.answer).toMatch(/Plaid|QuickBooks|cash/i);
    expect(turn.evidenceChain.links.some((l) => l.system === "plaid" && l.grounded)).toBe(true);
    expect(turn.memory.recentQuestions[0]).toBe("Why is cash down this month?");
  });

  it("supports explain and show evidence", () => {
    const ctx = mockContext();
    const explain = askCopilot(ctx, { question: "Explain the top recommendation" });
    expect(explain.intent).toBe("explain_recommendation");
    expect(explain.answer).toMatch(/Assumptions|Evidence|Confidence/i);

    const evidence = askCopilot(ctx, { question: "Show evidence" });
    expect(evidence.intent).toBe("show_evidence");
    expect(evidence.answer).toMatch(/AcademyOS/);
  });

  it("remembers session decisions for simulations", () => {
    const session = createSessionMemory({ organizationId: "exec-demo-org" });
    const turn = runConversation(
      mockContext(),
      { question: "What happens if we delay hiring?", session },
      {
        predictive: {
          headline: "Delay hiring softens payroll pressure",
          summary: "Payroll down, capacity risk up.",
          confidence: 0.64,
          domains: [
            {
              domain: "payroll",
              direction: "declining",
              narrative: "Payroll burden eases.",
              confidence: 0.7,
            },
          ],
          risks: ["Coverage gaps"],
        },
      }
    );
    expect(turn.intent).toBe("decision_simulator");
    expect(turn.scenario?.kind).toBe("delay_hiring");
    expect(turn.memory.currentDecisions[0]).toMatch(/Delay hiring/i);
  });
});

describe("morning brief", () => {
  it("includes cash, revenue, workforce, opportunities, risks, actions", () => {
    const brief = buildMorningBrief(mockContext());
    expect(brief.cash).toMatch(/180,000|Available cash/i);
    expect(brief.revenue).toMatch(/Revenue|900,000|12,000/i);
    expect(brief.workforce).toMatch(/Workforce|Students/i);
    expect(brief.topOpportunities[0]).toMatch(/enrollment|collections/i);
    expect(brief.topRisks.length).toBeGreaterThan(0);
    expect(brief.recommendedActions.length).toBeGreaterThan(0);
    expect(brief.evidenceChain.links).toHaveLength(8);
  });
});

describe("decision simulator catalog", () => {
  it("matches named scenarios", () => {
    expect(matchScenarioKind("Raise tuition 5%")).toBe("raise_tuition");
    expect(matchScenarioKind("Add a new campus")).toBe("add_campus");
    expect(matchScenarioKind("Reduce expenses")).toBe("reduce_expenses");
    expect(matchScenarioKind("Increase salaries")).toBe("increase_salaries");
    const def = resolveScenarioDefinition("Raise tuition 5%");
    expect(def.definition.domainMultipliers?.revenue).toBeGreaterThan(1);
  });

  it("builds simulation with evidence chain", () => {
    const sim = buildSimulationResult({
      context: mockContext(),
      question: "What happens if we raise tuition 5%?",
      kind: "raise_tuition",
      predictive: {
        headline: "Tuition +5% lifts revenue with enrollment risk",
        summary: "Revenue up, admissions soft.",
        confidence: 0.6,
        domains: [
          {
            domain: "revenue",
            direction: "accelerating",
            narrative: "Revenue rises ~5%.",
            confidence: 0.65,
          },
        ],
        risks: ["Price sensitivity"],
      },
    });
    expect(sim.recommendation.suggestedAction).toBeTruthy();
    expect(sim.evidenceChain.links[0]?.system).toBe("academyos");
    expect(sim.alternatives.length).toBeGreaterThan(0);
  });
});

describe("recommendationFromWisdom", () => {
  it("never cites disconnected systems as grounded evidence", () => {
    const ctx = mockContext({
      connectors: mockContext().connectors.map((c) => ({
        ...c,
        connected: false,
        bullets: [],
        metrics: [],
        syncedAt: null,
      })),
    });
    const rec = recommendationFromWisdom(ctx, ctx.intelligence.recommendations[0]!);
    const connectorLinks = rec.evidenceChain.links.filter((l) =>
      ["academyos", "quickbooks", "square", "plaid", "google-workspace"].includes(l.system)
    );
    expect(connectorLinks.every((l) => l.grounded === false)).toBe(true);
  });
});
