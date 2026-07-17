/**
 * Executive Copilot contracts — public surface for ECC composition.
 */

import type {
  CopilotAskRequest,
  CopilotAskResult,
  CopilotContext,
  CopilotRecommendation,
  DecisionSimulationResult,
  DecisionScenarioKind,
  EvidenceChain,
  ExecutiveMorningBrief,
  SessionMemory,
} from "./types";

export type CopilotEngine = {
  ask(context: CopilotContext, request: CopilotAskRequest): CopilotAskResult;
  brief(context: CopilotContext, session?: SessionMemory): ExecutiveMorningBrief;
  simulate(
    context: CopilotContext,
    question: string,
    kind?: DecisionScenarioKind,
    session?: SessionMemory
  ): DecisionSimulationResult;
  explain(recommendation: CopilotRecommendation): CopilotRecommendation["explainability"];
  showEvidence(recommendation: CopilotRecommendation): EvidenceChain;
};

export type {
  CopilotAskRequest,
  CopilotAskResult,
  CopilotContext,
  CopilotRecommendation,
  DecisionSimulationResult,
  DecisionScenarioKind,
  EvidenceChain,
  ExecutiveMorningBrief,
  SessionMemory,
};
