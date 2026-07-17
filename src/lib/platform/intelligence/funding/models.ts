/** Funding Intelligence model helpers (Sprint 034). */
import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { FinancialSignal, FundingBaseline, FundingConfidenceLevel, FundingConfidenceScore, FundingHealthStatus, FundingLensImpact, FundingPriorityBand, RevenueResultLight } from "@/lib/platform/intelligence/funding/types";
import {
  buildConfidenceAverageFunding,
  clamp01 as sharedClamp01,
  clampUnchecked,
  emptyGraphScope,
  levelFromValueFunding,
  periodLabelLocaleMonthYear,
  priorityFromRisk as sharedPriorityFromRisk,
  priorityFromScoreHighHealthy,
  scoreNarrative as sharedScoreNarrative,
  statusFromScore as sharedStatusFromScore,
} from "@/lib/platform/intelligence/common";


export function defaultFundingBaseline(): FundingBaseline {
  return {
    annualFundingNeed: 5_000_000, securedFunding: 3_250_000, pipelineFunding: 2_100_000,
    grantWinRate: 0.32, diversificationIndex: 0.58, concentrationRisk: 0.42,
    cashRunwayMonths: 12, restrictedShare: 0.55, unrestrictedShare: 0.45,
    governmentShare: 0.25, philanthropyShare: 0.25, investmentShare: 0.15,
    contractShare: 0.25, alternativeShare: 0.1, complianceReadiness: 76,
    proposalCapacity: 68, organizationHealthScore: 75, financialScore: 72,
    revenueHealthProxy: 70,
  };
}

export function deriveFundingBaseline(
  dna: OrganizationDNA | null | undefined,
  oios: OiosResult | null | undefined,
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  prediction: PredictionResult | null | undefined,
  financialSignal: FinancialSignal | null | undefined,
  revenueResult: RevenueResultLight | null | undefined,
  overrides?: Partial<FundingBaseline>
): FundingBaseline {
  const base = defaultFundingBaseline();
  const organizationHealthScore = clamp(oios?.health.score ?? graphInput?.organizationHealth?.overallScore ?? base.organizationHealthScore);
  const financialScore = clamp(graphInput?.organizationHealth?.financialScore ?? oios?.baseline.financialScore ?? base.financialScore);
  const revenue = financialSignal?.revenue ?? graphInput?.executive?.revenue ?? revenueResult?.baseline?.annualRevenue ?? 0;
  const expenses = financialSignal?.expenses ?? (revenue > 0 ? revenue * 1.08 : base.annualFundingNeed);
  const annualFundingNeed = Math.max(250_000, Math.round(Math.max(expenses, revenue * 1.15, base.annualFundingNeed * (0.7 + organizationHealthScore / 250))));
  const fundingKind = dna?.fundingModel?.primaryKind;
  const runwayFromDna = dna?.fundingModel?.runwayMonths;
  const riskSignals = prediction?.projection.emergingRisks?.filter((r) => /fund|cash|capital|grant|financ/i.test(`${r.title ?? ""} ${r.id ?? ""}`)) ?? [];
  const predictionRisk = riskSignals.length ? clamp01(riskSignals.reduce((sum, r) => sum + (r.score ?? 40), 0) / riskSignals.length / 100) : null;
  const graphRisk = analysis?.dashboard ? clamp01(analysis.dashboard.overallRisk) : 0.35;
  const fundingRisk = predictionRisk ?? graphRisk;
  const revenueHealthProxy = clamp(revenueResult?.healthScore?.value ?? (financialScore + organizationHealthScore) / 2);
  const securedRatio = clamp01(0.48 + financialScore / 300 - fundingRisk * 0.16);
  const securedFunding = Math.round(annualFundingNeed * securedRatio);
  const grantWinRate = clamp01(0.18 + organizationHealthScore / 500 + financialScore / 700 - fundingRisk * 0.08);
  const pipelineFunding = Math.round(Math.max(annualFundingNeed - securedFunding, annualFundingNeed * (0.25 + grantWinRate)));
  const diversificationIndex = clamp01(revenueResult?.baseline?.diversificationIndex ?? (fundingKind === "hybrid" ? 0.72 : 0.52 + organizationHealthScore / 500));
  const governmentShare = fundingKind === "grants" ? 0.35 : 0.25;
  const investmentShare = /angel|venture|debt/.test(fundingKind ?? "") ? 0.3 : 0.15;
  const philanthropyShare = fundingKind === "grants" ? 0.3 : 0.25;
  const contractShare = 0.25;
  const alternativeShare = Math.max(0.05, 1 - governmentShare - investmentShare - philanthropyShare - contractShare);
  const margin = financialSignal?.marginPct != null ? (financialSignal.marginPct > 1 ? financialSignal.marginPct / 100 : financialSignal.marginPct) : 0;
  const monthlyBurn = Math.max(1, (expenses - revenue * Math.max(0, 1 - margin)) / 12);
  const impliedRunway = clamp(Math.round((financialSignal?.cash ?? securedFunding * 0.2) / monthlyBurn), 2, 36);
  return {
    annualFundingNeed, securedFunding, pipelineFunding, grantWinRate, diversificationIndex,
    concentrationRisk: clamp01(1 - diversificationIndex), cashRunwayMonths: runwayFromDna ?? impliedRunway,
    restrictedShare: 0.55, unrestrictedShare: 0.45, governmentShare, philanthropyShare,
    investmentShare, contractShare, alternativeShare,
    complianceReadiness: clamp(55 + organizationHealthScore * 0.25 + financialScore * 0.1),
    proposalCapacity: clamp(45 + organizationHealthScore * 0.3 + revenueHealthProxy * 0.1),
    organizationHealthScore, financialScore, revenueHealthProxy, ...overrides,
  };
}

export const emptyFundingScope = (): GraphScope => emptyGraphScope();
export function defaultPeriodLabel(now: Date): string { return periodLabelLocaleMonthYear(now); }
export const clamp = clampUnchecked;
export const clamp01 = sharedClamp01;
export function statusFromScore(score: number): FundingHealthStatus { return sharedStatusFromScore(score); }
export function priorityFromScore(score: number): FundingPriorityBand { return priorityFromScoreHighHealthy(score); }
export function priorityFromRisk(risk: number): FundingPriorityBand { return sharedPriorityFromRisk(risk); }
export function levelFromValue(value: number): FundingConfidenceLevel { return levelFromValueFunding(value); }
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): FundingConfidenceScore {
  return buildConfidenceAverageFunding(factors) as FundingConfidenceScore;
}
export function scoreNarrative(label: string, value: number, status: FundingHealthStatus): string { return sharedScoreNarrative(label, value, status); }
export function buildLenses(input: FundingLensImpact): FundingLensImpact { return { ...input }; }
export function defaultCreateId(prefix: string): string { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
export const fundingModels = { defaultFundingBaseline, deriveFundingBaseline, emptyFundingScope, defaultPeriodLabel, clamp, clamp01, statusFromScore, priorityFromScore, priorityFromRisk, levelFromValue, buildConfidence, scoreNarrative, buildLenses, defaultCreateId };
