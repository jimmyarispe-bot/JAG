/**
 * Executive Copilot orchestrator — public engine implementation.
 */

import { buildMorningBrief } from "./brief/morning";
import { runConversation } from "./conversation/engine";
import type { CopilotEngine } from "./contracts";
import {
  buildSimulationResult,
  type PredictiveSoftResult,
} from "./simulator/engine";
import type {
  CopilotAskRequest,
  CopilotContext,
  DecisionScenarioKind,
  SessionMemory,
} from "./types";

export type OrchestratorDeps = {
  /** Optional predictive soft result supplier for decision simulation. */
  getPredictive?: (question: string, kind?: DecisionScenarioKind) => PredictiveSoftResult | null;
};

export function createCopilotEngine(deps: OrchestratorDeps = {}): CopilotEngine {
  return {
    ask(context, request) {
      const predictive = deps.getPredictive?.(request.question) ?? null;
      return runConversation(context, request, { predictive });
    },
    brief(context, session) {
      return buildMorningBrief(context, session);
    },
    simulate(context, question, kind, _session) {
      const predictive =
        deps.getPredictive?.(question, kind) ??
        ({
          headline: context.intelligence.predictiveHeadline || "Predictive scenario",
          summary: `Simulation for: ${question}`,
          confidence: 0.55,
          domains: [],
          risks: context.intelligence.riskHeadlines.slice(0, 3),
        } satisfies PredictiveSoftResult);
      return buildSimulationResult({ context, question, kind, predictive });
    },
    explain(recommendation) {
      return recommendation.explainability;
    },
    showEvidence(recommendation) {
      return recommendation.evidenceChain;
    },
  };
}

export function askCopilot(
  context: CopilotContext,
  request: CopilotAskRequest,
  deps: OrchestratorDeps = {}
) {
  return createCopilotEngine(deps).ask(context, request);
}

export function morningBrief(context: CopilotContext, session?: SessionMemory) {
  return createCopilotEngine().brief(context, session);
}
