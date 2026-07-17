import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  CompetitiveBaseline, CompetitiveConfidenceLevel, CompetitiveConfidenceScore,
  CompetitiveHealthStatus, CompetitiveLens, CompetitiveOutlook, CompetitivePriorityBand,
  CompetitiveRequest,
} from "@/lib/platform/intelligence/competitive/types";
import { COMPETITIVE_AREAS } from "@/lib/platform/intelligence/competitive/types";
import {
  OUTLOOK_THRESHOLDS_STANDARD,
  buildConfidenceAverage,
  clamp as sharedClamp,
  defaultCreateId as sharedDefaultCreateId,
  emptyGraphScope,
  levelFromValue as sharedLevelFromValue,
  lightScore as sharedLightScore,
  outlookFromScoreConfigured,
  periodLabelQuarter,
  priorityFromScoreLowUrgent,
  statusFromScore as sharedStatusFromScore,
} from "@/lib/platform/intelligence/common";


export const clamp = sharedClamp;
export function statusFromScore(score: number): CompetitiveHealthStatus { return sharedStatusFromScore(score); }
export function priorityFromScore(score: number): CompetitivePriorityBand { return priorityFromScoreLowUrgent(score); }
export function levelFromValue(value: number): CompetitiveConfidenceLevel { return sharedLevelFromValue(value); }
export function outlookFromScore(score: number, volatility = 0): CompetitiveOutlook {
  return outlookFromScoreConfigured(score, volatility, {
    volatileLabel: "volatile",
    high: { min: OUTLOOK_THRESHOLDS_STANDARD.high, label: "advancing" },
    mid: { min: OUTLOOK_THRESHOLDS_STANDARD.mid, label: "stable" },
    low: { min: OUTLOOK_THRESHOLDS_STANDARD.low, label: "pressured" },
    fallback: "uncertain",
  });
}
export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): CompetitiveConfidenceScore {
  return buildConfidenceAverage(factors) as CompetitiveConfidenceScore;
}
export function buildLens(lens: CompetitiveLens): CompetitiveLens {
  return {
    competitiveThreatExists: lens.competitiveThreatExists,
    evidenceSupports: lens.evidenceSupports,
    competitorsInvolved: lens.competitorsInvolved,
    ourDifferentiation: lens.ourDifferentiation,
    enrollmentOrRevenueImpact: lens.enrollmentOrRevenueImpact,
    responseOptions: lens.responseOptions,
    organizationalCapabilitiesRequired: lens.organizationalCapabilitiesRequired,
    signalsToMonitor: lens.signalsToMonitor,
  };
}
export const defaultCreateId = sharedDefaultCreateId;
export const defaultPeriodLabel = periodLabelQuarter;
export const emptyCompetitiveScope = (): GraphScope => emptyGraphScope();
const lightScore = sharedLightScore;

export function defaultCompetitiveBaseline(): CompetitiveBaseline {
  return {
    organizationHealthScore: 72, executionScore: 68,
    areaScores: {
      direct_peer_schools: 62, indirect_substitutes: 60, tuition_aid_positioning: 58,
      program_curriculum_differentiation: 66, enrollment_admissions_dynamics: 63,
      regional_market_share: 61, talent_faculty_competition: 59,
      brand_reputation_choice_drivers: 65, partnership_alliance_landscape: 64,
      technology_delivery_models: 67, expansion_launch_signals: 60,
      consolidation_network_strategy: 62,
    },
    competitivePressure: 55, differentiationStrength: 64, marketSharePosition: 60,
    brandStrength: 65, threatLevel: 52, opportunityIndex: 63,
    forecastMaturity: 60, scenarioMaturity: 58, evidenceCoverage: 62,
  };
}

export function deriveCompetitiveBaseline(request: CompetitiveRequest): CompetitiveBaseline {
  const base = defaultCompetitiveBaseline();
  const health = request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore ?? base.organizationHealthScore;
  const market = lightScore(request.marketResult?.competitivePositionScore?.value ?? request.marketResult?.marketScore?.value ?? request.marketResult?.healthScore?.value, base.areaScores.direct_peer_schools);
  const competitivePressureRaw = lightScore(request.marketResult?.competitivePressure?.value, base.competitivePressure);
  const competitorCount = lightScore(request.marketResult?.competitorCount?.value, 5);
  const revenue = lightScore(request.revenueResult?.revenueScore?.value ?? request.revenueResult?.healthScore?.value, base.areaScores.tuition_aid_positioning);
  const customer = lightScore(request.customerResult?.satisfactionScore?.value ?? request.customerResult?.customerScore?.value ?? request.customerResult?.healthScore?.value, base.areaScores.brand_reputation_choice_drivers);
  const humanCapital = lightScore(request.humanCapitalResult?.workforceScore?.value ?? request.humanCapitalResult?.humanCapitalScore?.value ?? request.humanCapitalResult?.healthScore?.value, base.areaScores.talent_faculty_competition);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, base.opportunityIndex);
  const innovation = lightScore(request.innovationResult?.innovationScore?.value ?? request.innovationResult?.healthScore?.value, base.areaScores.technology_delivery_models);
  const economic = lightScore(request.economicResult?.economicScore?.value ?? request.economicResult?.healthScore?.value, base.areaScores.regional_market_share);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);

  const areaScores = { ...base.areaScores };
  areaScores.direct_peer_schools = clamp(market * .6 + (100 - competitivePressureRaw * .5) * .4);
  areaScores.indirect_substitutes = clamp((innovation + economic) / 2);
  areaScores.tuition_aid_positioning = clamp(revenue * .7 + market * .3);
  areaScores.program_curriculum_differentiation = clamp((innovation + market) / 2);
  areaScores.enrollment_admissions_dynamics = clamp((customer + market) / 2);
  areaScores.regional_market_share = clamp(economic * .5 + market * .5);
  areaScores.talent_faculty_competition = clamp(humanCapital);
  areaScores.brand_reputation_choice_drivers = clamp(customer * .6 + market * .4);
  areaScores.partnership_alliance_landscape = clamp((opportunity + market) / 2);
  areaScores.technology_delivery_models = clamp(innovation);
  areaScores.expansion_launch_signals = clamp((market + opportunity) / 2 + competitorCount);
  areaScores.consolidation_network_strategy = clamp((market + economic) / 2);

  const differentiationStrength = clamp((areaScores.program_curriculum_differentiation + areaScores.brand_reputation_choice_drivers + areaScores.technology_delivery_models) / 3);
  const marketSharePosition = clamp((areaScores.regional_market_share + areaScores.enrollment_admissions_dynamics) / 2);
  const brandStrength = clamp(areaScores.brand_reputation_choice_drivers);
  const threatLevel = clamp(100 - (areaScores.direct_peer_schools * .4 + areaScores.indirect_substitutes * .3 + areaScores.expansion_launch_signals * .3));
  const opportunityIndex = clamp((areaScores.partnership_alliance_landscape + areaScores.technology_delivery_models + areaScores.program_curriculum_differentiation) / 3);
  const competitivePressureOut = clamp(threatLevel * .6 + (100 - differentiationStrength) * .4);

  return {
    ...base,
    organizationHealthScore: clamp(lightScore(health, 72)),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    competitivePressure: competitivePressureOut,
    differentiationStrength,
    marketSharePosition,
    brandStrength,
    threatLevel,
    opportunityIndex,
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.direct_peer_schools) / 2),
    evidenceCoverage: clamp((market + customer + humanCapital + innovation) / 4),
    ...request.baselineOverrides,
  };
}

export const competitiveModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyCompetitiveScope,
  defaultCompetitiveBaseline, deriveCompetitiveBaseline,
};
export class CompetitiveModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveCompetitiveBaseline;
  static baseline = defaultCompetitiveBaseline; static outlook = outlookFromScore;
}
