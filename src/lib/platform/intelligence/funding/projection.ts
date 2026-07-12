/** Funding projection and query services. */
import type * as C from "@/lib/platform/intelligence/funding/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/funding/models";
import type * as T from "@/lib/platform/intelligence/funding/types";
export class FundingProjection implements C.FundingProjection {
  project(input: Parameters<C.FundingProjection["project"]>[0]): T.FundingProjectionResult { return { generatedAt: input.brief.generatedAt, headline: input.brief.headline, healthScore: input.scores.healthScore.value, opportunityScore: input.scores.opportunityScore.value, riskScore: input.scores.riskScore.value, forecast: input.forecast, topOpportunities: input.topOpportunities, brief: input.brief, dashboard: input.dashboard, metrics: { annualFundingNeed: input.baseline.annualFundingNeed, securedFunding: input.baseline.securedFunding, pipelineFunding: input.baseline.pipelineFunding, cashRunwayMonths: input.baseline.cashRunwayMonths, diversificationIndex: input.baseline.diversificationIndex }, overallConfidence: input.confidence }; }
}
export class FundingQueries implements C.FundingQueries {
  ask(result: T.FundingResult, request: T.FundingQueryRequest): T.FundingQueryResult {
    const focus = request.focus ?? "general"; const max = request.maxResults ?? 5; let answer = result.brief.headline; let references = result.recommendations.slice(0, max);
    switch (focus) {
      case "government": answer = `${result.federalFunding.length + result.stateFunding.length + result.countyFunding.length + result.cityFunding.length} core government opportunities were identified.`; references = [...result.federalFunding, ...result.stateFunding].slice(0, max).map((x) => x.narrative); break;
      case "grants": answer = result.grantPipeline.narrative; references = result.grantPipeline.opportunities.slice(0, max).map((x) => x.narrative); break;
      case "contracts": answer = result.contractForecast.narrative; references = result.rfpOpportunities.slice(0, max).map((x) => x.narrative); break;
      case "philanthropy": answer = result.capitalCampaigns[0]?.narrative ?? "No campaign plan available."; references = result.foundationMatches.slice(0, max).map((x) => x.narrative); break;
      case "investment": answer = result.debtFinancing[0]?.narrative ?? "No financing opportunity available."; references = [...result.angelInvestors, ...result.ventureCapital].slice(0, max).map((x) => x.narrative); break;
      case "alternative": answer = result.licensingRevenue[0]?.narrative ?? "No alternative source available."; references = [...result.crowdfunding, ...result.sponsorships, ...result.taxCredits].slice(0, max).map((x) => x.narrative); break;
      case "strategy": answer = result.diversification.narrative; references = result.mix.slice(0, max).map((x) => x.narrative); break;
      case "forecast": answer = `Weighted grant pipeline is $${Math.round(result.grantPipeline.weightedPipeline).toLocaleString()}.`; references = result.grantPipeline.forecast.slice(0, max).map((x) => `${x.period}: $${x.weightedAwards.toLocaleString()}`); break;
      case "risk": answer = result.riskDashboard.narrative; references = result.risks.slice(0, max).map((x) => x.narrative); break;
    }
    return { question: request.question, focus, answer, references, confidence: buildConfidence([{ key: "result", label: "Result coverage", contribution: result.confidence.value }, { key: "focus", label: "Focus specificity", contribution: focus === "general" ? 0.6 : 0.85 }]) };
  }
}
