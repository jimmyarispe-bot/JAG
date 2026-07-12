/** Opportunity projection and query services (Sprint 035). */
import type * as C from "@/lib/platform/intelligence/opportunity/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/opportunity/models";
import type * as T from "@/lib/platform/intelligence/opportunity/types";

export class OpportunityProjection implements C.OpportunityProjection {
  project(input: Parameters<C.OpportunityProjection["project"]>[0]): T.OpportunityProjectionResult {
    const averageRoi = input.topOpportunities.length
      ? input.topOpportunities.reduce((s, o) => s + o.roi, 0) / input.topOpportunities.length
      : 0;
    const averageConfidence = input.topOpportunities.length
      ? input.topOpportunities.reduce((s, o) => s + o.confidence, 0) / input.topOpportunities.length
      : input.confidence.value;
    return {
      generatedAt: input.brief.generatedAt,
      headline: input.brief.headline,
      opportunityScore: input.scores.opportunityScore.value,
      healthScore: input.scores.healthScore.value,
      pipeline: input.pipeline,
      topOpportunities: input.topOpportunities,
      brief: input.brief,
      dashboard: input.dashboard,
      metrics: {
        pipelineValue: input.pipeline.totalValue,
        realizedValueYtd: input.baseline.realizedValueYtd,
        quickWinCount: input.dashboard.quickWinCount,
        strategicCount: input.dashboard.strategicCount,
        averageRoi,
        averageConfidence,
      },
      overallConfidence: input.confidence,
    };
  }
}

export class OpportunityQueries implements C.OpportunityQueries {
  ask(result: T.OpportunityResult, request: T.OpportunityQueryRequest): T.OpportunityQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;
    let answer = result.brief.headline;
    let references = result.recommendations.slice(0, max);

    switch (focus) {
      case "revenue":
        answer = `${result.categories.revenue.length} revenue opportunities are active.`;
        references = result.categories.revenue.slice(0, max).map((x) => x.narrative);
        break;
      case "funding":
        answer = `${result.categories.funding.length} funding opportunities are active.`;
        references = result.categories.funding.slice(0, max).map((x) => x.narrative);
        break;
      case "cost":
        answer = `${result.categories.cost_reduction.length + result.categories.procurement_savings.length} cost and procurement opportunities are active.`;
        references = [...result.categories.cost_reduction, ...result.categories.procurement_savings]
          .slice(0, max)
          .map((x) => x.narrative);
        break;
      case "growth":
        answer = `${result.categories.market_expansion.length + result.categories.customer_growth.length} growth opportunities are active.`;
        references = [...result.categories.market_expansion, ...result.categories.customer_growth]
          .slice(0, max)
          .map((x) => x.narrative);
        break;
      case "partnership":
        answer = `${result.categories.partnership.length + result.categories.strategic_alliance.length} partnership opportunities are active.`;
        references = [...result.categories.partnership, ...result.categories.strategic_alliance]
          .slice(0, max)
          .map((x) => x.narrative);
        break;
      case "technology":
        answer = `${result.categories.technology.length + result.categories.automation.length} technology and automation opportunities are active.`;
        references = [...result.categories.technology, ...result.categories.automation]
          .slice(0, max)
          .map((x) => x.narrative);
        break;
      case "mission":
        answer = result.missionOpportunityDashboard.narrative;
        references = result.missionOpportunityDashboard.opportunities.slice(0, max).map((x) => x.narrative);
        break;
      case "quick_wins":
        answer = result.quickWinsDashboard.narrative;
        references = result.quickWinsDashboard.opportunities.slice(0, max).map((x) => x.narrative);
        break;
      case "strategic":
        answer = result.strategicInvestmentDashboard.narrative;
        references = result.strategicInvestmentDashboard.opportunities.slice(0, max).map((x) => x.narrative);
        break;
      case "pipeline":
        answer = result.pipeline.narrative;
        references = result.pipeline.stages.slice(0, max).map((s) => `${s.stage}: ${s.count} / $${s.value.toLocaleString()}`);
        break;
      case "risk":
        answer = result.analysis.risk.slice(0, 1).map((r) => r.narrative).join(" ") || "No elevated opportunity risks.";
        references = result.analysis.risk.slice(0, max).map((x) => x.narrative);
        break;
    }

    return {
      question: request.question,
      focus,
      answer,
      references,
      confidence: buildConfidence([
        { key: "result", label: "Result coverage", contribution: result.confidence.value },
        { key: "focus", label: "Focus specificity", contribution: focus === "general" ? 0.6 : 0.85 },
      ]),
    };
  }
}
