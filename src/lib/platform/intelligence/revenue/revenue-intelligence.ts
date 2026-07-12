/**
 * Revenue Intelligence — scores, dashboards, health, brief (Sprint 033).
 */

import type {
  CustomerValueDashboard as CustomerValueDashboardContract,
  ExecutiveRevenueBriefGenerator as ExecutiveRevenueBriefGeneratorContract,
  ExpansionOpportunityAggregator as ExpansionOpportunityAggregatorContract,
  MarginDashboard as MarginDashboardContract,
  PricingDashboard as PricingDashboardContract,
  PricingRecommendationAggregator as PricingRecommendationAggregatorContract,
  RevenueDashboard as RevenueDashboardContract,
  RevenueForecastComposer as RevenueForecastComposerContract,
  RevenueHealth as RevenueHealthContract,
  RevenueIntelligence as RevenueIntelligenceContract,
} from "@/lib/platform/intelligence/revenue/contracts";
import {
  buildConfidence,
  buildLenses,
  clamp,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/revenue/models";
import type {
  CashGenerationAnalysisResult,
  ContributionMarginResult,
  CustomerLtvRecord,
  CustomerValueDashboardResult,
  DemandForecastResult,
  DiscountOptimizationRecord,
  DiversificationAnalysisResult,
  DynamicPricingRecord,
  ExecutiveRevenueBrief,
  ExpansionRecommendation,
  GrossMarginAnalysisResult,
  MarginDashboardResult,
  MarketExpansionRecord,
  NetMarginAnalysisResult,
  OpportunityScoreRecord,
  PricingDashboardResult,
  PricingRecommendation,
  RecurringRevenueAnalysisResult,
  RevenueBaseline,
  RevenueConfidenceScore,
  RevenueDashboardResult,
  RevenueForecastPoint,
  RevenueGrowthPlan,
  RevenueHealthResult,
  RevenueRequest,
  RevenueRiskRecord,
  RevenueScenarioPlan,
  RevenueScore,
} from "@/lib/platform/intelligence/revenue/types";

export class RevenueIntelligence implements RevenueIntelligenceContract {
  composeScores(input: {
    baseline: RevenueBaseline;
    diversification: DiversificationAnalysisResult;
    recurring: RecurringRevenueAnalysisResult;
    risks: RevenueRiskRecord[];
    grossMargin: GrossMarginAnalysisResult;
    growthPlans: RevenueGrowthPlan[];
  }): {
    healthScore: RevenueScore;
    growthScore: RevenueScore;
    riskScore: RevenueScore;
  } {
    const avgRisk =
      input.risks.length > 0
        ? input.risks.reduce((s, r) => s + r.score, 0) / input.risks.length
        : 0.3;

    const planGrowth =
      input.growthPlans[0]?.targetGrowthPct ?? input.baseline.growthRate;
    const growthValue = clamp(
      input.baseline.growthRate * 250 +
        (input.baseline.nrr - 1) * 120 +
        planGrowth * 80 +
        input.baseline.pipelineCoverage * 8
    );

    const healthValue = clamp(
      input.grossMargin.grossMarginPct * 35 +
        input.diversification.index * 25 +
        input.recurring.nrr * 20 +
        input.baseline.cashConversion * 20 +
        (100 - avgRisk * 100) * 0.15
    );

    const riskValue = clamp(avgRisk * 70 + (1 - input.diversification.index) * 20 + input.baseline.churnRate * 40);

    return {
      healthScore: {
        key: "revenue_health",
        label: "Revenue Health Score",
        value: healthValue,
        status: statusFromScore(healthValue),
        band: priorityFromScore(healthValue),
        narrative: scoreNarrative(
          "Revenue health",
          healthValue,
          statusFromScore(healthValue)
        ),
      },
      growthScore: {
        key: "revenue_growth",
        label: "Revenue Growth Score",
        value: growthValue,
        status: statusFromScore(growthValue),
        band: priorityFromScore(growthValue),
        narrative: scoreNarrative(
          "Revenue growth",
          growthValue,
          statusFromScore(growthValue)
        ),
      },
      riskScore: {
        key: "revenue_risk",
        label: "Revenue Risk Score",
        value: riskValue,
        status: statusFromScore(100 - riskValue),
        band: priorityFromRisk(riskValue / 100),
        narrative: `Revenue risk is ${priorityFromRisk(riskValue / 100)} at ${Math.round(riskValue)}.`,
      },
    };
  }

  buildHealth(input: {
    baseline: RevenueBaseline;
    scores: {
      healthScore: RevenueScore;
      growthScore: RevenueScore;
      riskScore: RevenueScore;
    };
    diversification: DiversificationAnalysisResult;
    recurring: RecurringRevenueAnalysisResult;
    cashGeneration: CashGenerationAnalysisResult;
  }): RevenueHealthResult {
    return new RevenueHealth().assess(input);
  }
}

export class RevenueHealth implements RevenueHealthContract {
  assess(input: {
    baseline: RevenueBaseline;
    scores: {
      healthScore: RevenueScore;
      growthScore: RevenueScore;
      riskScore: RevenueScore;
    };
    diversification: DiversificationAnalysisResult;
    recurring: RecurringRevenueAnalysisResult;
    cashGeneration: CashGenerationAnalysisResult;
  }): RevenueHealthResult {
    const dimensions = {
      growth: input.scores.growthScore.value,
      recurring: clamp(input.recurring.nrr * 70 + (1 - input.recurring.churnRate) * 30),
      margin: clamp(input.baseline.grossMargin * 100),
      diversification: clamp(input.diversification.index * 100),
      cash: clamp(input.cashGeneration.cashConversion * 100),
    };
    const overallScore = clamp(
      dimensions.growth * 0.2 +
        dimensions.recurring * 0.25 +
        dimensions.margin * 0.2 +
        dimensions.diversification * 0.15 +
        dimensions.cash * 0.2
    );
    const status = statusFromScore(overallScore);
    return {
      overallScore,
      status,
      dimensions,
      lenses: buildLenses({
        sustainableRevenue: `Overall revenue health ${status} at ${Math.round(overallScore)}.`,
        profitability: `Margin dimension ${Math.round(dimensions.margin)} supports profitability.`,
        missionImpact: `Healthy revenue systems stabilize mission funding.`,
        revenueRisk: `Risk score ${Math.round(input.scores.riskScore.value)} remains a watch item.`,
        longTermHealth: `Diversification ${Math.round(dimensions.diversification)} and cash ${Math.round(dimensions.cash)} anchor long-term health.`,
      }),
      narrative: `Revenue health ${status} (${Math.round(overallScore)}).`,
    };
  }
}

export class RevenueDashboard implements RevenueDashboardContract {
  compose(input: {
    scores: {
      healthScore: RevenueScore;
      growthScore: RevenueScore;
      riskScore: RevenueScore;
    };
    baseline: RevenueBaseline;
    now: Date;
  }): RevenueDashboardResult {
    const recurringShare =
      input.baseline.recurringRevenue /
      Math.max(1, input.baseline.annualRevenue);
    const status = statusFromScore(input.scores.healthScore.value);
    return {
      generatedAt: input.now.toISOString(),
      healthScore: input.scores.healthScore.value,
      growthScore: input.scores.growthScore.value,
      riskScore: input.scores.riskScore.value,
      annualRevenue: input.baseline.annualRevenue,
      recurringShare: Number(recurringShare.toFixed(3)),
      status,
      headline: `Revenue ${status}: health ${Math.round(input.scores.healthScore.value)}, growth ${Math.round(input.scores.growthScore.value)}, risk ${Math.round(input.scores.riskScore.value)}`,
      narrative: `Unified revenue dashboard for $${input.baseline.annualRevenue.toLocaleString()} annual with ${Math.round(recurringShare * 100)}% recurring.`,
    };
  }
}

export class PricingDashboard implements PricingDashboardContract {
  build(input: {
    recommendations: PricingRecommendation[];
    baseline: RevenueBaseline;
    now: Date;
  }): PricingDashboardResult {
    const expectedLift = input.recommendations.reduce(
      (s, r) => s + r.expectedLift,
      0
    );
    const competitiveness = input.baseline.priceCompetitiveness;
    const status = statusFromScore(competitiveness);
    return {
      generatedAt: input.now.toISOString(),
      competitiveness,
      recommendationCount: input.recommendations.length,
      expectedLift,
      recommendations: input.recommendations,
      status,
      narrative: `Pricing ${status}: ${input.recommendations.length} recommendations, +$${expectedLift.toLocaleString()} lift.`,
    };
  }
}

export class MarginDashboard implements MarginDashboardContract {
  build(input: {
    grossMargin: GrossMarginAnalysisResult;
    netMargin: NetMarginAnalysisResult;
    contributionMargin: ContributionMarginResult;
    now: Date;
  }): MarginDashboardResult {
    const composite = clamp(
      input.grossMargin.grossMarginPct * 40 +
        input.contributionMargin.contributionMarginPct * 35 +
        input.netMargin.netMarginPct * 100 * 0.25
    );
    const status = statusFromScore(composite);
    return {
      generatedAt: input.now.toISOString(),
      grossMargin: input.grossMargin.grossMarginPct,
      netMargin: input.netMargin.netMarginPct,
      contributionMargin: input.contributionMargin.contributionMarginPct,
      status,
      narrative: `Margin dashboard ${status}: gross ${Math.round(input.grossMargin.grossMarginPct * 100)}%, net ${Math.round(input.netMargin.netMarginPct * 100)}%, CM ${Math.round(input.contributionMargin.contributionMarginPct * 100)}%.`,
    };
  }
}

export class CustomerValueDashboard
  implements CustomerValueDashboardContract
{
  build(input: {
    customerLtv: CustomerLtvRecord[];
    baseline: RevenueBaseline;
    recurring: RecurringRevenueAnalysisResult;
    now: Date;
  }): CustomerValueDashboardResult {
    const averageLtv =
      input.customerLtv.length > 0
        ? Math.round(
            input.customerLtv.reduce((s, c) => s + c.ltv, 0) /
              input.customerLtv.length
          )
        : input.baseline.ltv;
    const averageCac =
      input.customerLtv.length > 0
        ? Math.round(
            input.customerLtv.reduce((s, c) => s + c.cac, 0) /
              input.customerLtv.length
          )
        : input.baseline.cac;
    const ltvCacRatio = Number((averageLtv / Math.max(1, averageCac)).toFixed(2));
    const status = statusFromScore(clamp(ltvCacRatio * 20));
    return {
      generatedAt: input.now.toISOString(),
      averageLtv,
      averageCac,
      ltvCacRatio,
      nrr: input.recurring.nrr,
      status,
      narrative: `Customer value ${status}: LTV:CAC ${ltvCacRatio}, NRR ${input.recurring.nrr.toFixed(2)}.`,
    };
  }
}

export class ExecutiveRevenueBriefGenerator
  implements ExecutiveRevenueBriefGeneratorContract
{
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  generate(input: {
    request: RevenueRequest;
    baseline: RevenueBaseline;
    healthScore: RevenueScore;
    growthScore: RevenueScore;
    riskScore: RevenueScore;
    diversification: DiversificationAnalysisResult;
    recurring: RecurringRevenueAnalysisResult;
    risks: RevenueRiskRecord[];
    expansionOpportunities: ExpansionRecommendation[];
    confidence: RevenueConfidenceScore;
    now: Date;
  }): ExecutiveRevenueBrief {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const topRisk = input.risks[0];

    return {
      id: createId("rev-brief"),
      title: "Executive Revenue Brief",
      generatedAt: input.now.toISOString(),
      periodLabel:
        input.request.periodLabel ??
        input.now.toLocaleString("en-US", { month: "long", year: "numeric" }),
      headline: `Revenue ${input.healthScore.status}; growth ${input.growthScore.band}; risk ${input.riskScore.band}`,
      revenueSummary: `${input.healthScore.narrative} Annual $${input.baseline.annualRevenue.toLocaleString()} with NRR ${input.recurring.nrr.toFixed(2)}.`,
      profitabilitySummary: `Gross margin ${Math.round(input.baseline.grossMargin * 100)}%, net ${Math.round(input.baseline.netMargin * 100)}%, contribution ${Math.round(input.baseline.contributionMargin * 100)}%.`,
      growthSummary: `${input.growthScore.narrative} Pipeline coverage ${input.baseline.pipelineCoverage.toFixed(1)}x.`,
      riskSummary: topRisk
        ? `${topRisk.title} is ${topRisk.band}; diversification index ${Math.round(input.diversification.index * 100)}.`
        : input.riskScore.narrative,
      missionSummary: `Sustainable revenue and margin quality protect mission delivery; ${input.expansionOpportunities.length} expansion opportunities scored.`,
      decisionsNeeded: [
        input.riskScore.value >= 45
          ? "Authorize mitigation plan for top revenue risks"
          : "Confirm revenue risk watch cadence",
        input.expansionOpportunities[0]
          ? `Approve staged investment for ${input.expansionOpportunities[0].opportunity}`
          : "Prioritize next expansion bet",
        input.baseline.priceCompetitiveness < 65
          ? "Review pricing competitiveness and discount governance"
          : "Maintain pricing discipline rituals",
      ],
      watchItems: [
        `Churn ${(input.baseline.churnRate * 100).toFixed(1)}%`,
        `Cash conversion ${(input.baseline.cashConversion * 100).toFixed(0)}%`,
        `LTV:CAC ${(input.baseline.ltv / Math.max(1, input.baseline.cac)).toFixed(1)}`,
      ],
      confidence: input.confidence,
    };
  }
}

export class RevenueForecastComposer
  implements RevenueForecastComposerContract
{
  compose(input: {
    forecast: RevenueForecastPoint[];
    demandForecast: DemandForecastResult;
    scenarios: RevenueScenarioPlan[];
  }): RevenueForecastPoint[] {
    if (input.forecast.length === 0) return input.forecast;
    const upside = input.scenarios.find((s) => /upside/i.test(s.name));
    const demandLift =
      input.demandForecast.trend === "up"
        ? 1.02
        : input.demandForecast.trend === "down"
          ? 0.98
          : 1;
    return input.forecast.map((p, i) => ({
      ...p,
      revenue: Math.round(
        p.revenue * demandLift + (upside && i === input.forecast.length - 1 ? upside.revenueDelta * 0.25 : 0)
      ),
      recurring: Math.round(p.recurring * demandLift),
    }));
  }
}

export class ExpansionOpportunityAggregator
  implements ExpansionOpportunityAggregatorContract
{
  aggregate(input: {
    expansions: ExpansionRecommendation[];
    marketExpansion: MarketExpansionRecord[];
    opportunities: OpportunityScoreRecord[];
  }): ExpansionRecommendation[] {
    const fromMarket = input.marketExpansion.slice(0, 2).map((m) => ({
      id: m.id,
      opportunity: m.market,
      expectedRevenue: m.expectedRevenue,
      investment: m.investment,
      priority: m.priority,
      lenses: m.lenses,
      narrative: m.narrative,
    }));
    const fromOpp = input.opportunities.slice(0, 2).map((o) => ({
      id: o.id,
      opportunity: o.opportunity,
      expectedRevenue: o.expectedRevenue,
      investment: Math.round(o.expectedRevenue * 0.35),
      priority: o.priority,
      lenses: o.lenses,
      narrative: o.narrative,
    }));
    const merged = [...input.expansions, ...fromMarket, ...fromOpp];
    const seen = new Set<string>();
    return merged.filter((m) => {
      const key = m.opportunity.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export class PricingRecommendationAggregator
  implements PricingRecommendationAggregatorContract
{
  aggregate(input: {
    pricing: PricingRecommendation[];
    dynamic: DynamicPricingRecord[];
    discounts: DiscountOptimizationRecord[];
  }): PricingRecommendation[] {
    const fromDynamic = input.dynamic.slice(0, 2).map((d) => ({
      id: d.id,
      offering: d.offering,
      currentPrice: d.basePrice,
      recommendedPrice: d.adjustedPrice,
      model: "hybrid" as const,
      elasticity: -1.0,
      expectedLift: Math.max(0, d.adjustedPrice - d.basePrice) * 40,
      priority: priorityFromScore(d.demandIndex),
      lenses: d.lenses,
      narrative: d.narrative,
    }));
    const fromDisc = input.discounts.slice(0, 1).map((d) => ({
      id: d.id,
      offering: `${d.segment} discount policy`,
      currentPrice: 100,
      recommendedPrice: Math.round(100 * (1 - d.recommendedDiscountPct)),
      model: "hybrid" as const,
      elasticity: -1.2,
      expectedLift: Math.round(d.marginImpact * 100000),
      priority: d.priority,
      lenses: d.lenses,
      narrative: d.narrative,
    }));
    return [...input.pricing, ...fromDynamic, ...fromDisc];
  }
}

export function defaultRevenueConfidence(
  baseline: RevenueBaseline,
  hasDna: boolean,
  hasOios: boolean
): RevenueConfidenceScore {
  return buildConfidence([
    {
      key: "baseline",
      label: "Revenue baseline coverage",
      contribution: 0.55,
    },
    {
      key: "dna",
      label: "Organizational DNA signal",
      contribution: hasDna ? 0.85 : 0.35,
    },
    {
      key: "oios",
      label: "OIOS operating system signal",
      contribution: hasOios ? 0.85 : 0.35,
    },
    {
      key: "financial",
      label: "Financial score coverage",
      contribution: clamp(baseline.financialScore / 100, 0, 1),
    },
  ]);
}
