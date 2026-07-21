/**
 * Context assembly from soft-read lights (Sprint 067).
 */

import type {
  AutonomousResultLight,
  BriefingResultLight,
  CopilotRequest,
  DecisionIntelligenceResultLight,
  ExecutiveMemoryResultLight,
  ExecutivePredictiveResultLight,
  SynthesisResultLight,
} from "@/lib/platform/intelligence/executive-copilot/types";

export interface AssembledContext {
  synthesis?: SynthesisResultLight;
  briefing?: BriefingResultLight;
  memory?: ExecutiveMemoryResultLight;
  decision?: DecisionIntelligenceResultLight;
  predictive?: ExecutivePredictiveResultLight;
  autonomous?: AutonomousResultLight;
  availableDomainCount: number;
  conflictingEvidence: boolean;
}

export function assembleContext(request: CopilotRequest): AssembledContext {
  const synthesis = request.synthesisResult;
  const briefing = request.briefingResult;
  const memory = request.memoryResult;
  const decision = request.decisionResult;
  const predictive = request.predictiveResult;
  const autonomous = request.autonomousResult;

  const available = [synthesis, briefing, memory, decision, predictive, autonomous].filter(
    Boolean
  ).length;

  const riskDown = (briefing?.briefing?.sections?.topRisks?.length ?? 0) > 0;
  const oppUp = (briefing?.briefing?.sections?.topOpportunities?.length ?? 0) > 0;
  const forecastImprove = (predictive?.forecasts ?? []).some((f) => f.direction === "improving");
  const forecastDegrade = (predictive?.forecasts ?? []).some((f) => f.direction === "degrading");

  return {
    synthesis,
    briefing,
    memory,
    decision,
    predictive,
    autonomous,
    availableDomainCount: available,
    conflictingEvidence: (riskDown && oppUp) || (forecastImprove && forecastDegrade),
  };
}
