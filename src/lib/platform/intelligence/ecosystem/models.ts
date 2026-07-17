import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  EcosystemBaseline, EcosystemConfidenceLevel, EcosystemConfidenceScore,
  EcosystemHealthStatus, EcosystemLens, EcosystemOutlook, EcosystemPriorityBand,
  EcosystemRequest,
} from "@/lib/platform/intelligence/ecosystem/types";
import { ECOSYSTEM_AREAS } from "@/lib/platform/intelligence/ecosystem/types";
import {
  OUTLOOK_THRESHOLDS_ELEVATED,
  buildConfidenceAverage,
  clamp as sharedClamp,
  defaultCreateId as sharedDefaultCreateId,
  emptyGraphScope,
  levelFromValue as sharedLevelFromValue,
  lightScoreClamped as sharedLightScore,
  outlookFromScoreConfigured,
  periodLabelIsoMonth,
  priorityFromScoreLowUrgent,
  statusFromScore as sharedStatusFromScore,
} from "@/lib/platform/intelligence/common";


export const clamp = sharedClamp;
export function statusFromScore(score: number): EcosystemHealthStatus { return sharedStatusFromScore(score); }
export function priorityFromScore(score: number): EcosystemPriorityBand { return priorityFromScoreLowUrgent(score); }
export function levelFromValue(value: number): EcosystemConfidenceLevel { return sharedLevelFromValue(value); }
export function outlookFromScore(score: number, volatility = 0): EcosystemOutlook {
  return outlookFromScoreConfigured(score, volatility, {
    volatileLabel: "volatile",
    high: { min: OUTLOOK_THRESHOLDS_ELEVATED.high, label: "expanding" },
    mid: { min: OUTLOOK_THRESHOLDS_ELEVATED.mid, label: "stable" },
    low: { min: OUTLOOK_THRESHOLDS_ELEVATED.low, label: "fragmented" },
    fallback: "uncertain",
  });
}
export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): EcosystemConfidenceScore {
  return buildConfidenceAverage(factors) as EcosystemConfidenceScore;
}
export function buildLens(partial: Partial<EcosystemLens> = {}): EcosystemLens {
  return {
    networkStrength: partial.networkStrength ?? "Network strength requires confirmation.",
    strategicPartnerships: partial.strategicPartnerships ?? "Strategic partnerships require confirmation.",
    ecosystemHealth: partial.ecosystemHealth ?? "Ecosystem health requires confirmation.",
    collaborationPotential: partial.collaborationPotential ?? "Collaboration potential requires confirmation.",
    dependencyRisk: partial.dependencyRisk ?? "Dependency risk requires confirmation.",
    networkEffects: partial.networkEffects ?? "Network effects require confirmation.",
    strategicPosition: partial.strategicPosition ?? "Strategic position requires confirmation.",
    longTermEcosystemOutlook: partial.longTermEcosystemOutlook ?? "Long-term ecosystem outlook requires confirmation.",
  };
}
export const defaultCreateId = sharedDefaultCreateId;
export const defaultPeriodLabel = periodLabelIsoMonth;
export const emptyEcosystemScope = (): GraphScope => emptyGraphScope();

export function defaultEcosystemBaseline(): EcosystemBaseline {
  const areaScores = Object.fromEntries(ECOSYSTEM_AREAS.map(a => [a, 68])) as EcosystemBaseline["areaScores"];
  return {
    organizationHealthScore: 72,
    executionScore: 70,
    areaScores,
    networkStrength: 68,
    strategicPartnerships: 68,
    ecosystemHealth: 68,
    collaborationPotential: 68,
    dependencyRisk: 68,
    networkEffects: 68,
    strategicPosition: 68,
    longTermEcosystemOutlook: 68,
    forecastMaturity: 65,
    scenarioMaturity: 64,
    evidenceCoverage: 66,
  };
}

const lightScore = sharedLightScore;

export function deriveEcosystemBaseline(request: EcosystemRequest): EcosystemBaseline {
  const base = defaultEcosystemBaseline();
  const health = lightScore(
    request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore,
    base.organizationHealthScore,
  );
  const stakeholder = lightScore(request.stakeholderResult?.healthScore?.value ?? request.stakeholderResult?.engagementScore?.value, 70);
  const competitive = lightScore(request.competitiveResult?.competitiveScore?.value ?? request.competitiveResult?.healthScore?.value, 70);
  const market = lightScore(request.marketResult?.marketScore?.value ?? request.marketResult?.healthScore?.value, 70);
  const systems = lightScore(request.systemsResult?.healthScore?.value, 70);
  const systemsAdapt = lightScore(request.systemsResult?.adaptability, systems);
  const resilience = lightScore(request.resilienceResult?.healthScore?.value ?? request.resilienceResult?.adaptiveCapacity, 70);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, 70);
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);

  const areaScores = { ...base.areaScores };
  areaScores.ecosystem_mapping = clamp((systems + stakeholder + market) / 3);
  areaScores.strategic_partnerships = clamp((stakeholder + competitive + opportunity) / 3);
  areaScores.supplier_ecosystems = clamp((market + systems + resilience) / 3);
  areaScores.customer_ecosystems = clamp((market + stakeholder + opportunity) / 3);
  areaScores.community_networks = clamp((stakeholder + market + decision) / 3);
  areaScores.industry_networks = clamp((competitive + market + stakeholder) / 3);
  areaScores.technology_ecosystems = clamp((systems + competitive + predictive) / 3);
  areaScores.academic_research_partnerships = clamp((opportunity + stakeholder + decision) / 3);
  areaScores.government_ecosystems = clamp((stakeholder + decision + market) / 3);
  areaScores.investor_funding_networks = clamp((opportunity + market + predictive) / 3);
  areaScores.nonprofit_ngo_relationships = clamp((stakeholder + opportunity + decision) / 3);
  areaScores.platform_ecosystems = clamp((competitive + systems + market) / 3);
  areaScores.alliance_intelligence = clamp((competitive + stakeholder + opportunity) / 3);
  areaScores.network_effects = clamp((market + systems + competitive) / 3);
  areaScores.ecosystem_dependencies = clamp((systems + resilience + competitive) / 3);
  areaScores.collaboration_opportunities = clamp((opportunity + stakeholder + decision) / 3);
  areaScores.ecosystem_risk = clamp((resilience + competitive + systemsAdapt) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(health),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    networkStrength: clamp(areaScores.ecosystem_mapping),
    strategicPartnerships: clamp(areaScores.strategic_partnerships),
    ecosystemHealth: clamp((areaScores.ecosystem_mapping + areaScores.network_effects + areaScores.ecosystem_risk) / 3),
    collaborationPotential: clamp(areaScores.collaboration_opportunities),
    dependencyRisk: clamp(100 - areaScores.ecosystem_dependencies),
    networkEffects: clamp(areaScores.network_effects),
    strategicPosition: clamp((areaScores.alliance_intelligence + areaScores.strategic_partnerships + competitive) / 3),
    longTermEcosystemOutlook: clamp((areaScores.network_effects + predictive + opportunity) / 3),
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.ecosystem_risk) / 2),
    evidenceCoverage: clamp((stakeholder + competitive + market + systems + resilience) / 5),
    ...request.baselineOverrides,
  };
}

export const ecosystemModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyEcosystemScope,
  defaultEcosystemBaseline, deriveEcosystemBaseline,
};
export class EcosystemModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveEcosystemBaseline;
  static baseline = defaultEcosystemBaseline; static outlook = outlookFromScore;
}
