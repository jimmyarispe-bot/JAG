/**
 * Market Intelligence — projection and queries.
 */

import type {
  MarketProjection as MarketProjectionContract,
  MarketQueries as MarketQueriesContract,
} from "@/lib/platform/intelligence/market/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/market/models";
import type {
  MarketProjectionResult,
  MarketQueryRequest,
  MarketQueryResult,
  MarketResult,
} from "@/lib/platform/intelligence/market/types";

export class MarketProjection implements MarketProjectionContract {
  project(input: Parameters<MarketProjectionContract["project"]>[0]): MarketProjectionResult {
    return {
      generatedAt: input.brief.generatedAt,
      headline: input.brief.headline,
      healthScore: input.scores.healthScore.value,
      competitivePositionScore: input.scores.competitivePositionScore.value,
      expansionOpportunityScore: input.scores.expansionOpportunityScore.value,
      marketRiskScore: input.scores.marketRiskScore.value,
      industryScore: input.scores.industryScore.value,
      marketSizeScore: input.scores.marketSizeScore.value,
      pricingScore: input.scores.pricingScore.value,
      demandScore: input.scores.demandScore.value,
      demographicScore: input.scores.demographicScore.value,
      geographicScore: input.scores.geographicScore.value,
      economicScore: input.scores.economicScore.value,
      technologyScore: input.scores.technologyScore.value,
      partnershipScore: input.scores.partnershipScore.value,
      maScore: input.scores.maScore.value,
      whiteSpaceScore: input.scores.whiteSpaceScore.value,
      dashboard: input.dashboard,
      competitiveDashboard: input.competitiveDashboard,
      expansionDashboard: input.expansionDashboard,
      trendDashboard: input.trendDashboard,
      brief: input.brief,
      metrics: {
        competitorCount: input.baseline.competitorCount,
        expansionCandidateCount: input.baseline.expansionCandidateCount,
        signalDensity: input.baseline.signalDensity,
        marketShareEstimate: input.baseline.marketShareEstimate,
        tam: input.marketSize.estimates.tam,
        sam: input.marketSize.estimates.sam,
        som: input.marketSize.estimates.som,
      },
      overallConfidence: input.confidence,
    };
  }
}

export class MarketQueries implements MarketQueriesContract {
  ask(result: MarketResult, request: MarketQueryRequest): MarketQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;
    let answer: string;
    let references: string[];

    switch (focus) {
      case "industry":
        answer = result.industry.narrative;
        references = result.industry.segments.slice(0, max).map((segment) => segment.narrative);
        break;
      case "competitive":
        answer = result.competitive.narrative;
        references = result.competitive.competitors.slice(0, max).map((competitor) => competitor.narrative);
        break;
      case "market_size":
        answer = result.marketSize.narrative;
        references = [result.marketSize.estimates.narrative];
        break;
      case "pricing":
        answer = result.pricing.narrative;
        references = result.pricing.bands.slice(0, max).map((band) => band.narrative);
        break;
      case "demand":
        answer = result.customerDemand.narrative;
        references = result.customerDemand.signals.slice(0, max).map((signal) => signal.narrative);
        break;
      case "demographic":
        answer = result.demographic.narrative;
        references = result.demographic.cohorts.slice(0, max).map((cohort) => cohort.narrative);
        break;
      case "geographic":
        answer = result.geographicExpansion.narrative;
        references = result.geographicExpansion.candidates.slice(0, max).map((candidate) => candidate.narrative);
        break;
      case "economic":
        answer = result.economicTrend.narrative;
        references = result.economicTrend.indicators.slice(0, max).map((indicator) => indicator.narrative);
        break;
      case "technology":
        answer = result.technologyTrend.narrative;
        references = result.technologyTrend.trends.slice(0, max).map((trend) => trend.narrative);
        break;
      case "partnership":
        answer = result.partnership.narrative;
        references = result.partnership.partnerships.slice(0, max).map((partnership) => partnership.narrative);
        break;
      case "ma":
        answer = result.mergersAcquisitions.narrative;
        references = result.mergersAcquisitions.targets.slice(0, max).map((target) => target.narrative);
        break;
      case "white_space":
        answer = result.whiteSpace.narrative;
        references = result.whiteSpace.opportunities.slice(0, max).map((opportunity) => opportunity.narrative);
        break;
      case "signals":
        answer = result.signals.narrative;
        references = result.signals.signals.slice(0, max).map((signal) => signal.narrative);
        break;
      case "recommendations":
        answer = `Market recommendations (${result.recommendations.length}).`;
        references = result.recommendations.slice(0, max).map((recommendation) => recommendation.title);
        break;
      case "reasoning":
        answer = result.reasoning.answer;
        references = result.reasoning.connectedOpportunities.slice(0, max);
        break;
      default:
        answer = result.brief.headline;
        references = result.recommendations.slice(0, max).map((recommendation) => recommendation.title);
    }

    return {
      question: request.question,
      focus,
      answer,
      references,
      confidence: buildConfidence([
        { key: "result", label: "Result confidence", contribution: result.confidence.value },
        { key: "focus", label: "Focus specificity", contribution: focus === "general" ? 0.55 : 0.82 },
      ]),
    };
  }
}
