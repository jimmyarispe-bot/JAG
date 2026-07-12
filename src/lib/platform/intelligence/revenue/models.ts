/**
 * Revenue Intelligence — RevenueModels helpers (Sprint 033).
 */

import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  GraphAnalysisResult,
  GraphBuildInput,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type {
  FinancialSignal,
  RevenueBaseline,
  RevenueConfidenceLevel,
  RevenueConfidenceScore,
  RevenueHealthStatus,
  RevenueLensImpact,
  RevenuePriorityBand,
} from "@/lib/platform/intelligence/revenue/types";

/** Default baseline when no upstream signals are supplied. */
export function defaultRevenueBaseline(): RevenueBaseline {
  return {
    annualRevenue: 4_200_000,
    recurringRevenue: 3_150_000,
    oneTimeRevenue: 1_050_000,
    growthRate: 0.12,
    churnRate: 0.08,
    nrr: 1.08,
    grr: 0.92,
    averageDealSize: 18_500,
    pipelineCoverage: 2.4,
    winRate: 0.32,
    grossMargin: 0.62,
    netMargin: 0.14,
    contributionMargin: 0.48,
    priceCompetitiveness: 72,
    diversificationIndex: 0.58,
    cashConversion: 0.78,
    customerCount: 220,
    arpu: 19_090,
    ltv: 72_000,
    cac: 14_500,
    organizationHealthScore: 75,
    financialScore: 72,
  };
}

/** Derive baseline from DNA / OIOS / graph / prediction / financial / overrides. */
export function deriveRevenueBaseline(
  dna: OrganizationDNA | null | undefined,
  oios: OiosResult | null | undefined,
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  prediction: PredictionResult | null | undefined,
  financialSignal: FinancialSignal | null | undefined,
  overrides?: Partial<RevenueBaseline>
): RevenueBaseline {
  const base = defaultRevenueBaseline();

  const organizationHealthScore = clamp(
    oios?.health.score ??
      graphInput?.organizationHealth?.overallScore ??
      base.organizationHealthScore,
    0,
    100
  );

  const financialScore = clamp(
    graphInput?.organizationHealth?.financialScore ??
      oios?.baseline.financialScore ??
      base.financialScore,
    0,
    100
  );

  const revenueFromGraph = graphInput?.executive?.revenue;
  const revenueFromSignal = financialSignal?.revenue;
  const annualRevenue =
    revenueFromSignal && revenueFromSignal > 0
      ? revenueFromSignal
      : revenueFromGraph && revenueFromGraph > 0
        ? revenueFromGraph
        : dna?.score != null
          ? Math.round(
              base.annualRevenue * (0.7 + (dna.score.overall / 100) * 0.6)
            )
          : base.annualRevenue;

  const recurringShare = dna?.revenueModel?.streams?.length
    ? clamp01(
        dna.revenueModel.streams
          .filter((s) =>
            /subscription|recurring|retainer|membership/i.test(
              `${s.kind} ${s.pricingModel} ${s.name}`
            )
          )
          .reduce((sum, s) => sum + s.shareEstimate, 0) || 0.65
      )
    : 0.75;

  const recurringRevenue = Math.round(annualRevenue * recurringShare);
  const oneTimeRevenue = Math.max(0, annualRevenue - recurringRevenue);

  const predictionRevenueRisk =
    prediction?.projection.emergingRisks?.find((r) =>
      /revenue|cash|margin|churn|financ/i.test(r.title ?? r.id ?? "")
    )?.score != null
      ? clamp01((prediction.projection.emergingRisks[0]!.score ?? 30) / 100)
      : null;

  const graphRisk = analysis?.dashboard
    ? clamp01(analysis.dashboard.overallRisk)
    : null;

  const revenueRisk = predictionRevenueRisk ?? graphRisk ?? 0.28;

  const growthRate = clamp(
    0.04 + (financialScore / 100) * 0.16 - revenueRisk * 0.08,
    -0.15,
    0.45
  );

  const churnRate = clamp01(0.04 + revenueRisk * 0.12);
  const grr = clamp(1 - churnRate, 0.7, 0.99);
  const nrr = clamp(grr + 0.12 + growthRate * 0.4, 0.8, 1.4);

  const grossMargin = clamp01(
    financialSignal?.marginPct != null && financialSignal.marginPct > 0
      ? financialSignal.marginPct > 1
        ? financialSignal.marginPct / 100
        : financialSignal.marginPct
      : 0.45 + (financialScore / 100) * 0.25
  );
  const contributionMargin = clamp01(grossMargin - 0.12);
  const netMargin = clamp01(grossMargin - 0.42 + (financialScore / 100) * 0.08);

  const diversificationIndex = dna?.revenueModel?.streams?.length
    ? clamp01(
        Math.min(
          1,
          dna.revenueModel.streams.length / 5 +
            1 /
              Math.max(
                1,
                Math.max(...dna.revenueModel.streams.map((s) => s.shareEstimate)) *
                  4
              )
        )
      )
    : base.diversificationIndex;

  const customerCount = Math.max(
    40,
    Math.round(
      (annualRevenue / base.arpu) * (0.85 + organizationHealthScore / 500)
    )
  );
  const arpu = Math.round(annualRevenue / Math.max(1, customerCount));
  const cac = Math.round(
    base.cac * (1.1 - financialScore / 400 + revenueRisk * 0.3)
  );
  const ltv = Math.round(arpu * (1 / Math.max(0.05, churnRate)) * grossMargin);

  const winRate = clamp01(0.22 + (financialScore / 100) * 0.2 - revenueRisk * 0.1);
  const pipelineCoverage = clamp(1.6 + growthRate * 4 + winRate, 1, 5);
  const averageDealSize = Math.round(arpu * 0.95);
  const priceCompetitiveness = clamp(
    Math.round(68 + (financialScore - 70) * 0.4 - revenueRisk * 20),
    0,
    100
  );
  const cashConversion = clamp01(
    0.65 + netMargin * 0.4 - revenueRisk * 0.15
  );

  return {
    annualRevenue,
    recurringRevenue,
    oneTimeRevenue,
    growthRate,
    churnRate,
    nrr,
    grr,
    averageDealSize,
    pipelineCoverage,
    winRate,
    grossMargin,
    netMargin,
    contributionMargin,
    priceCompetitiveness,
    diversificationIndex,
    cashConversion,
    customerCount,
    arpu,
    ltv,
    cac,
    organizationHealthScore,
    financialScore,
    ...overrides,
  };
}

export function emptyRevenueScope(): GraphScope {
  return { organizationId: null, schoolId: null };
}

export function defaultPeriodLabel(now: Date): string {
  return now.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function statusFromScore(score: number): RevenueHealthStatus {
  if (score >= 85) return "excellent";
  if (score >= 70) return "healthy";
  if (score >= 50) return "warning";
  return "critical";
}

export function priorityFromScore(score: number): RevenuePriorityBand {
  if (score >= 85) return "monitor";
  if (score >= 70) return "low";
  if (score >= 55) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

export function priorityFromRisk(score: number): RevenuePriorityBand {
  if (score >= 0.75) return "critical";
  if (score >= 0.55) return "high";
  if (score >= 0.35) return "medium";
  if (score >= 0.2) return "low";
  return "monitor";
}

export function levelFromValue(value: number): RevenueConfidenceLevel {
  if (value >= 0.8) return "high";
  if (value >= 0.55) return "medium";
  if (value >= 0.25) return "low";
  return "unknown";
}

export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): RevenueConfidenceScore {
  const value = clamp01(
    factors.reduce((sum, f) => sum + f.contribution, 0) /
      Math.max(1, factors.length)
  );
  return { value, level: levelFromValue(value), factors };
}

export function scoreNarrative(
  label: string,
  value: number,
  status: RevenueHealthStatus
): string {
  return `${label} is ${status} at ${Math.round(value)}.`;
}

/** Build a five-lens impact block for recommendations and analyses. */
export function buildLenses(input: {
  sustainableRevenue: string;
  profitability: string;
  missionImpact: string;
  revenueRisk: string;
  longTermHealth: string;
}): RevenueLensImpact {
  return {
    sustainableRevenue: input.sustainableRevenue,
    profitability: input.profitability,
    missionImpact: input.missionImpact,
    revenueRisk: input.revenueRisk,
    longTermHealth: input.longTermHealth,
  };
}

export function defaultCreateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const revenueModels = {
  clamp,
  clamp01,
  defaultRevenueBaseline,
  deriveRevenueBaseline,
  emptyRevenueScope,
  defaultPeriodLabel,
  statusFromScore,
  priorityFromScore,
  priorityFromRisk,
  levelFromValue,
  buildConfidence,
  scoreNarrative,
  buildLenses,
  defaultCreateId,
};
