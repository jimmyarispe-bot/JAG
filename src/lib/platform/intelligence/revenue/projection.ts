/**
 * Revenue Intelligence — projection + queries (Sprint 033).
 */

import type {
  RevenueProjection as RevenueProjectionContract,
  RevenueQueries as RevenueQueriesContract,
} from "@/lib/platform/intelligence/revenue/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/revenue/models";
import type {
  RevenueProjectionResult,
  RevenueQueryRequest,
  RevenueQueryResult,
  RevenueResult,
} from "@/lib/platform/intelligence/revenue/types";

export class RevenueProjection implements RevenueProjectionContract {
  project(input: {
    request: Parameters<RevenueProjectionContract["project"]>[0]["request"];
    healthScore: Parameters<RevenueProjectionContract["project"]>[0]["healthScore"];
    growthScore: Parameters<RevenueProjectionContract["project"]>[0]["growthScore"];
    riskScore: Parameters<RevenueProjectionContract["project"]>[0]["riskScore"];
    forecast: Parameters<RevenueProjectionContract["project"]>[0]["forecast"];
    expansionOpportunities: Parameters<RevenueProjectionContract["project"]>[0]["expansionOpportunities"];
    pricingRecommendations: Parameters<RevenueProjectionContract["project"]>[0]["pricingRecommendations"];
    brief: Parameters<RevenueProjectionContract["project"]>[0]["brief"];
    confidence: Parameters<RevenueProjectionContract["project"]>[0]["confidence"];
    dashboard: Parameters<RevenueProjectionContract["project"]>[0]["dashboard"];
    pricingDashboard: Parameters<RevenueProjectionContract["project"]>[0]["pricingDashboard"];
    marginDashboard: Parameters<RevenueProjectionContract["project"]>[0]["marginDashboard"];
    customerValueDashboard: Parameters<RevenueProjectionContract["project"]>[0]["customerValueDashboard"];
    baseline: Parameters<RevenueProjectionContract["project"]>[0]["baseline"];
  }): RevenueProjectionResult {
    return {
      generatedAt: input.brief.generatedAt,
      headline: input.brief.headline,
      healthScore: input.healthScore.value,
      growthScore: input.growthScore.value,
      riskScore: input.riskScore.value,
      forecast: input.forecast,
      expansionOpportunities: input.expansionOpportunities,
      pricingRecommendations: input.pricingRecommendations,
      brief: input.brief,
      dashboard: input.dashboard,
      pricingDashboard: input.pricingDashboard,
      marginDashboard: input.marginDashboard,
      customerValueDashboard: input.customerValueDashboard,
      metrics: {
        annualRevenue: input.baseline.annualRevenue,
        customerCount: input.baseline.customerCount,
        pipelineCoverage: input.baseline.pipelineCoverage,
        winRate: input.baseline.winRate,
        grossMargin: input.baseline.grossMargin,
        nrr: input.baseline.nrr,
      },
      overallConfidence: input.confidence,
    };
  }
}

export class RevenueQueries implements RevenueQueriesContract {
  ask(
    result: RevenueResult,
    request: RevenueQueryRequest
  ): RevenueQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;

    let answer: string;
    let references: string[] = [];

    switch (focus) {
      case "strategy":
        answer = result.diversification.narrative;
        references = result.optimizations.slice(0, max).map((o) => o.narrative);
        break;
      case "pricing":
        answer = result.pricingDashboard.narrative;
        references = result.pricingRecommendations
          .slice(0, max)
          .map((r) => r.narrative);
        break;
      case "offerings":
        answer = result.lifecycle.narrative;
        references = result.expansionOpportunities
          .slice(0, max)
          .map((e) => e.narrative);
        break;
      case "customers":
        answer = result.customerValueDashboard.narrative;
        references = result.customerLtv.slice(0, max).map((c) => c.narrative);
        break;
      case "sales":
        answer = result.pipeline.narrative;
        references = result.salesPerformance
          .slice(0, max)
          .map((s) => s.narrative);
        break;
      case "market":
        answer = result.demandForecast.narrative;
        references = result.opportunities.slice(0, max).map((o) => o.narrative);
        break;
      case "margins":
        answer = result.marginDashboard.narrative;
        references = [
          result.grossMargin.narrative,
          result.netMargin.narrative,
          result.unitEconomics.narrative,
        ].slice(0, max);
        break;
      case "forecast":
        answer = `Forecast ends at $${result.forecast[result.forecast.length - 1]?.revenue.toLocaleString() ?? result.baseline.annualRevenue.toLocaleString()}.`;
        references = result.scenarios.slice(0, max).map((s) => s.narrative);
        break;
      case "risk":
        answer = result.riskScore.narrative;
        references = result.risks.slice(0, max).map((r) => r.narrative);
        break;
      default:
        answer = result.brief.headline;
        references = result.recommendations.slice(0, max);
    }

    return {
      question: request.question,
      focus,
      answer,
      references,
      confidence: buildConfidence([
        {
          key: "result",
          label: "Result coverage",
          contribution: result.confidence.value,
        },
        {
          key: "focus",
          label: "Focus specificity",
          contribution: focus === "general" ? 0.55 : 0.8,
        },
      ]),
    };
  }
}
