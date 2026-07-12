/**
 * Business Model Intelligence — projection + queries (Sprint 037).
 */

import type {
  BusinessModelProjection as BusinessModelProjectionContract,
  BusinessModelQueries as BusinessModelQueriesContract,
} from "@/lib/platform/intelligence/business-model/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/business-model/models";
import type {
  BusinessModelProjectionResult,
  BusinessModelQueryRequest,
  BusinessModelQueryResult,
  BusinessModelResult,
} from "@/lib/platform/intelligence/business-model/types";

export class BusinessModelProjection implements BusinessModelProjectionContract {
  project(input: {
    request: Parameters<BusinessModelProjectionContract["project"]>[0]["request"];
    healthScore: Parameters<BusinessModelProjectionContract["project"]>[0]["healthScore"];
    clarityScore: Parameters<BusinessModelProjectionContract["project"]>[0]["clarityScore"];
    scalabilityScore: Parameters<BusinessModelProjectionContract["project"]>[0]["scalabilityScore"];
    sustainabilityScore: Parameters<BusinessModelProjectionContract["project"]>[0]["sustainabilityScore"];
    canvas: Parameters<BusinessModelProjectionContract["project"]>[0]["canvas"];
    leanCanvas: Parameters<BusinessModelProjectionContract["project"]>[0]["leanCanvas"];
    brief: Parameters<BusinessModelProjectionContract["project"]>[0]["brief"];
    confidence: Parameters<BusinessModelProjectionContract["project"]>[0]["confidence"];
    dashboard: Parameters<BusinessModelProjectionContract["project"]>[0]["dashboard"];
    baseline: Parameters<BusinessModelProjectionContract["project"]>[0]["baseline"];
  }): BusinessModelProjectionResult {
    return {
      generatedAt: input.brief.generatedAt,
      headline: input.brief.headline,
      healthScore: input.healthScore.value,
      clarityScore: input.clarityScore.value,
      scalabilityScore: input.scalabilityScore.value,
      sustainabilityScore: input.sustainabilityScore.value,
      canvas: input.canvas,
      leanCanvas: input.leanCanvas,
      brief: input.brief,
      dashboard: input.dashboard,
      metrics: {
        annualRevenue: input.baseline.annualRevenue,
        grossMargin: input.baseline.grossMargin,
        growthRate: input.baseline.growthRate,
        competitivePosition: input.baseline.competitivePosition,
        capitalIntensity: input.baseline.capitalIntensity,
        operationalComplexity: input.baseline.operationalComplexity,
      },
      overallConfidence: input.confidence,
    };
  }
}

export class BusinessModelQueries implements BusinessModelQueriesContract {
  ask(
    result: BusinessModelResult,
    request: BusinessModelQueryRequest
  ): BusinessModelQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;

    let answer: string;
    let references: string[] = [];

    switch (focus) {
      case "canvas":
        answer = result.canvas.narrative;
        references = result.canvas.blocks
          .slice(0, max)
          .map((b) => b.narrative);
        break;
      case "lean":
        answer = result.leanCanvas.narrative;
        references = result.leanCanvas.blocks
          .slice(0, max)
          .map((b) => b.narrative);
        break;
      case "design":
        answer = result.organizationDesign.narrative;
        references = [
          result.organizationDesign.current.narrative,
          result.organizationDesign.recommended.narrative,
          ...result.organizationDesign.alternatives
            .slice(0, max - 2)
            .map((a) => a.narrative),
        ];
        break;
      case "simulation":
        answer = result.comparison.narrative;
        references = result.simulations.slice(0, max).map((s) => s.narrative);
        break;
      case "scenarios":
        answer = result.scenarios.narrative;
        references = result.scenarios.scenarios
          .slice(0, max)
          .map((s) => s.narrative);
        break;
      case "risk":
        answer = result.riskScore.narrative;
        references = result.risks.slice(0, max).map((r) => r.narrative);
        break;
      case "opportunity":
        answer = result.opportunities[0]?.narrative ?? result.brief.summary;
        references = result.opportunities.slice(0, max).map((o) => o.narrative);
        break;
      case "roadmap":
        answer = result.evolutionRoadmap.narrative;
        references = result.evolutionRoadmap.steps
          .slice(0, max)
          .map((s) => s.narrative);
        break;
      case "competitive":
        answer = result.competitivePosition.narrative;
        references = result.competitivePosition.strengths.slice(0, max);
        break;
      default:
        answer = result.brief.headline;
        references = result.recommendations.slice(0, max).map((r) => r.title);
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
