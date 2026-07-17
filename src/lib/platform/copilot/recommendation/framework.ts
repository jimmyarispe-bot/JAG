/**
 * Recommendation framework — maps wisdom outputs into the eight-question executive lens.
 */

import { buildEvidenceChainFromContext } from "../evidence/chain";
import type {
  CopilotContext,
  CopilotRecommendation,
  ExecutiveReasoningLens,
  ExplainabilityBundle,
  IntelligenceSnapshot,
} from "../types";

function confidenceLevel(value: number): string {
  if (value >= 0.75) return "high";
  if (value >= 0.5) return "medium";
  if (value > 0) return "low";
  return "unknown";
}

function normalizeConfidence(score: number): number {
  if (score > 1) return Math.min(1, score / 100);
  return Math.max(0, Math.min(1, score));
}

export function buildExplainability(
  reasoning: ExecutiveReasoningLens,
  evidenceStatements: string[],
  assumptions: string[],
  calculations: string[],
  alternatives: string[]
): ExplainabilityBundle {
  return {
    explain: [
      reasoning.whatHappened,
      reasoning.whyItHappened,
      reasoning.whyItMatters,
      reasoning.whatShouldIDo,
      reasoning.whyNow,
    ].join(" "),
    evidence: evidenceStatements,
    assumptions,
    calculations,
    confidence: {
      value: reasoning.confidence.value,
      level: reasoning.confidence.level,
      rationale: `Calibrated from wisdom confidence (${reasoning.confidence.level}) and grounded connector coverage.`,
    },
    alternatives,
  };
}

export function recommendationFromWisdom(
  context: CopilotContext,
  rec: IntelligenceSnapshot["recommendations"][number],
  index = 0
): CopilotRecommendation {
  const judgment = context.intelligence.judgment;
  const conf = normalizeConfidence(rec.confidenceScore);
  const connected = context.connectors.filter((c) => c.connected).map((c) => c.system);

  const cashMetric = context.connectors
    .flatMap((c) => c.metrics)
    .find((m) => m.key === "availableCash" || m.key === "cash");
  const revenueMetric = context.connectors
    .flatMap((c) => c.metrics)
    .find((m) => m.key === "revenue" || m.key === "volume7d");

  const reasoning: ExecutiveReasoningLens = {
    whatHappened:
      connected.length > 0
        ? `Connected systems (${connected.join(", ")}) and wisdom intelligence surface: ${rec.title}.`
        : `Model baseline wisdom surfaces: ${rec.title}. Live connectors are not yet providing evidence.`,
    whyItHappened: rec.rationale || judgment?.why || rec.narrative,
    whyItMatters: rec.lenses.strategicValue || judgment?.why || rec.narrative,
    whatShouldIDo: rec.action || judgment?.whatLeadershipShouldDo || rec.title,
    whyNow: judgment?.whyNow || rec.lenses.wisdomScore || "Timing follows current organizational priorities.",
    alternatives: (judgment?.whyNotAlternatives || rec.lenses.tradeOffBalance || "")
      .split(/[;.]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 12)
      .slice(0, 4),
    risks: (judgment?.risksRemaining || rec.lenses.evidenceQuality || "")
      .split(/[;.]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8)
      .slice(0, 4),
    confidence: { value: conf, level: confidenceLevel(conf) },
  };

  if (reasoning.alternatives.length === 0) {
    reasoning.alternatives = [
      "Defer and monitor for one planning cycle",
      "Pursue a narrower pilot before full commitment",
    ];
  }
  if (reasoning.risks.length === 0) {
    reasoning.risks = [
      "Evidence coverage may be incomplete if connectors are offline",
      "Execution capacity may constrain realization of expected outcomes",
    ];
  }

  const evidenceChain = buildEvidenceChainFromContext(
    context,
    rec.title,
    rec.action,
    reasoning.whyItHappened
  );

  const evidenceStatements = evidenceChain.links
    .filter((l) => l.grounded)
    .map((l) => l.statement);

  const calculations = [
    cashMetric != null
      ? `Cash signal (${cashMetric.label}): ${cashMetric.value ?? "n/a"}`
      : "Cash calculation deferred — no cash metric from connected systems.",
    revenueMetric != null
      ? `Revenue signal (${revenueMetric.label}): ${revenueMetric.value ?? "n/a"}`
      : "Revenue calculation deferred — no revenue metric from connected systems.",
    `Wisdom confidence score: ${rec.confidenceScore}`,
    `Grounded evidence links: ${evidenceChain.groundedCount}/${evidenceChain.links.length}`,
  ];

  const assumptions = [
    judgment?.assumptions || "Assumes connector sync freshness is sufficient for executive judgment.",
    "Assumes wisdom soft-lights from OIOS and domain inputs remain representative.",
    connected.length === 0
      ? "Operating on model baseline — live operational systems are not connected."
      : `Assumes ${connected.length} connected system(s) reflect current operations.`,
  ];

  const explainability = buildExplainability(
    reasoning,
    evidenceStatements,
    assumptions,
    calculations,
    reasoning.alternatives
  );

  return {
    id: rec.id || `copilot-rec-${index}`,
    title: rec.title,
    executiveSummary: rec.narrative || rec.rationale || rec.action,
    evidence: evidenceChain.links.filter((l) => l.grounded),
    supportingSystems: evidenceChain.systemsPresent,
    confidence: reasoning.confidence,
    tradeOffs: [
      rec.lenses.tradeOffBalance,
      judgment?.whyNotAlternatives || "Trade-offs follow wisdom balance analysis.",
    ].filter(Boolean),
    alternatives: reasoning.alternatives,
    financialImpact: cashMetric
      ? `Financial posture informed by ${cashMetric.label}=${cashMetric.value ?? "n/a"}; ${rec.lenses.strategicValue}`
      : rec.lenses.strategicValue || "Financial impact requires QuickBooks/Plaid/Square evidence.",
    humanImpact:
      rec.lenses.organizationalAlignment ||
      "Human capital impact assessed via AcademyOS / Workspace collaboration signals where connected.",
    riskImpact: judgment?.risksRemaining || reasoning.risks.join("; "),
    ethicalImpact: rec.lenses.ethicalIntegrity || "Ethical integrity reviewed via wisdom ethical lens.",
    longTermImpact: rec.lenses.longTermImpact || judgment?.expectedOutcome || rec.narrative,
    suggestedAction: rec.action,
    expectedOutcome: judgment?.expectedOutcome || rec.lenses.longTermImpact || rec.narrative,
    reasoning,
    explainability,
    evidenceChain,
    sourceRecommendationId: rec.id,
    priority: rec.priority,
  };
}

export function primaryRecommendation(context: CopilotContext): CopilotRecommendation | null {
  const first = context.intelligence.recommendations[0];
  if (!first) {
    if (!context.intelligence.judgment) return null;
    return recommendationFromWisdom(context, {
      id: "judgment-primary",
      title: "Executive judgment",
      action: context.intelligence.judgment.whatLeadershipShouldDo,
      rationale: context.intelligence.judgment.why,
      narrative: context.intelligence.judgment.expectedOutcome,
      priority: "high",
      confidenceScore: 0.6,
      evidenceRefs: [],
      lenses: {
        strategicValue: context.intelligence.judgment.why,
        longTermImpact: context.intelligence.judgment.expectedOutcome,
        confidenceLevel: "medium",
        evidenceQuality: context.intelligence.judgment.evidence,
        tradeOffBalance: context.intelligence.judgment.whyNotAlternatives,
        organizationalAlignment: context.intelligence.judgment.why,
        ethicalIntegrity: "Ethical integrity preserved via wisdom judgment.",
        wisdomScore: context.intelligence.judgment.whyNow,
      },
    });
  }
  return recommendationFromWisdom(context, first, 0);
}

export function allRecommendations(context: CopilotContext): CopilotRecommendation[] {
  if (context.intelligence.recommendations.length === 0) {
    const primary = primaryRecommendation(context);
    return primary ? [primary] : [];
  }
  return context.intelligence.recommendations.map((r, i) =>
    recommendationFromWisdom(context, r, i)
  );
}
