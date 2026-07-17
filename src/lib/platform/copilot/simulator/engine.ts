/**
 * Decision simulator — composes predictive forecasts + wisdom into an executive answer.
 */

import { buildEvidenceChainFromContext } from "../evidence/chain";
import { recommendationFromWisdom } from "../recommendation/framework";
import { resolveScenarioDefinition } from "./catalog";
import type {
  CopilotContext,
  DecisionScenarioKind,
  DecisionSimulationResult,
} from "../types";

export type PredictiveSoftResult = {
  headline?: string;
  summary?: string;
  confidence?: number;
  domains?: Array<{
    domain: string;
    direction: string;
    narrative: string;
    confidence: number;
  }>;
  risks?: string[];
};

/**
 * Build a simulation result from already-computed predictive soft output + context.
 * Callers (ECC loader) run predictiveIntelligence.service.predict and pass soft fields.
 */
export function buildSimulationResult(input: {
  context: CopilotContext;
  question: string;
  kind?: DecisionScenarioKind;
  predictive: PredictiveSoftResult;
}): DecisionSimulationResult {
  const resolved = resolveScenarioDefinition(input.question, input.kind);
  const confValue =
    input.predictive.confidence != null
      ? input.predictive.confidence > 1
        ? input.predictive.confidence / 100
        : input.predictive.confidence
      : 0.55;
  const confLevel = confValue >= 0.75 ? "high" : confValue >= 0.5 ? "medium" : "low";

  const judgment = input.context.intelligence.judgment;
  const wisdomJudgment =
    judgment?.whatLeadershipShouldDo ||
    input.context.intelligence.wisdomHeadline ||
    "Wisdom judgment unavailable for this scenario.";

  const syntheticRec = recommendationFromWisdom(input.context, {
    id: `sim-rec-${resolved.kind}`,
    title: resolved.title,
    action: wisdomJudgment,
    rationale:
      input.predictive.summary ||
      input.predictive.headline ||
      resolved.definition.description,
    narrative:
      input.predictive.headline ||
      `Scenario «${resolved.title}» evaluated with predictive + wisdom intelligence.`,
    priority: "high",
    confidenceScore: confValue,
    evidenceRefs: [],
    lenses: {
      strategicValue: input.predictive.headline || resolved.title,
      longTermImpact: judgment?.expectedOutcome || "Long-term impact follows predictive trajectory.",
      confidenceLevel: confLevel,
      evidenceQuality: `Grounded connectors: ${input.context.connectors.filter((c) => c.connected).length}/5`,
      tradeOffBalance: judgment?.whyNotAlternatives || "Compare deferral vs staged rollout.",
      organizationalAlignment: judgment?.why || "Aligned to current executive priorities.",
      ethicalIntegrity: "Ethical integrity preserved via wisdom ethical lens.",
      wisdomScore: judgment?.whyNow || "Act when predictive confidence and cash runway support it.",
    },
  });

  const evidenceChain = buildEvidenceChainFromContext(
    input.context,
    resolved.title,
    wisdomJudgment,
    input.predictive.summary || input.predictive.headline
  );

  const alternatives = [
    "Do nothing and re-evaluate next brief cycle",
    "Pilot at one campus / cohort before network rollout",
    ...(judgment?.whyNotAlternatives
      ? judgment.whyNotAlternatives.split(/[;.]/).map((s) => s.trim()).filter((s) => s.length > 12).slice(0, 2)
      : []),
  ];

  const risks =
    input.predictive.risks?.slice(0, 4) ||
    [
      judgment?.risksRemaining,
      "Forecast uncertainty rises when connectors are offline",
      "Second-order workforce and mission effects may lag financial signals",
    ].filter((x): x is string => Boolean(x));

  return {
    id: resolved.definition.id,
    kind: resolved.kind,
    title: resolved.title,
    question: input.question,
    summary:
      input.predictive.summary ||
      input.predictive.headline ||
      `Simulation of «${resolved.title}» using predictive intelligence and wisdom judgment.`,
    predictiveHeadline: input.predictive.headline || resolved.title,
    domainImpacts: input.predictive.domains ?? [],
    wisdomJudgment,
    risks,
    alternatives,
    confidence: { value: confValue, level: confLevel },
    evidenceChain,
    recommendation: {
      ...syntheticRec,
      evidenceChain,
      alternatives,
      reasoning: {
        ...syntheticRec.reasoning,
        alternatives,
        risks,
        whatHappened: `Scenario requested: ${resolved.title}.`,
        whyItHappened: input.predictive.summary || resolved.definition.description,
        whatShouldIDo: wisdomJudgment,
      },
    },
  };
}
