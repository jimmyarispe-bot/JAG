/**
 * Innovation Intelligence — projection and queries.
 */

import type {
  InnovationProjection as InnovationProjectionContract,
  InnovationQueries as InnovationQueriesContract,
} from "@/lib/platform/intelligence/innovation/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/innovation/models";
import type {
  InnovationProjectionResult,
  InnovationQueryRequest,
  InnovationQueryResult,
  InnovationResult,
} from "@/lib/platform/intelligence/innovation/types";

export class InnovationProjection implements InnovationProjectionContract {
  project(input: Parameters<InnovationProjectionContract["project"]>[0]): InnovationProjectionResult {
    return {
      generatedAt: input.brief.generatedAt,
      headline: input.brief.headline,
      healthScore: input.scores.healthScore.value,
      pipelineScore: input.scores.pipelineScore.value,
      experimentScore: input.scores.experimentScore.value,
      portfolioScore: input.scores.portfolioScore.value,
      radarScore: input.scores.radarScore.value,
      ideaScore: input.scores.ideaScore.value,
      rdScore: input.scores.rdScore.value,
      productServiceScore: input.scores.productServiceScore.value,
      processScore: input.scores.processScore.value,
      aiOpportunityScore: input.scores.aiOpportunityScore.value,
      technologyAdoptionScore: input.scores.technologyAdoptionScore.value,
      emergingTechScore: input.scores.emergingTechScore.value,
      pocScore: input.scores.pocScore.value,
      ipScore: input.scores.ipScore.value,
      continuousImprovementScore: input.scores.continuousImprovementScore.value,
      roadmapScore: input.scores.roadmapScore.value,
      dashboard: input.dashboard,
      pipelineDashboard: input.pipelineDashboard,
      experimentDashboard: input.experimentDashboard,
      portfolioDashboard: input.portfolioDashboard,
      radarDashboard: input.radarDashboard,
      brief: input.brief,
      metrics: {
        ideaCount: input.baseline.ideaCount,
        experimentCount: input.baseline.experimentCount,
        pocCount: input.baseline.pocCount,
        ipAssetCount: input.baseline.ipAssetCount,
        radarItemCount: input.baseline.radarItemCount,
        h1Share: input.baseline.h1Share,
        h2Share: input.baseline.h2Share,
        h3Share: input.baseline.h3Share,
      },
      overallConfidence: input.confidence,
    };
  }
}

export class InnovationQueries implements InnovationQueriesContract {
  ask(result: InnovationResult, request: InnovationQueryRequest): InnovationQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;
    let answer: string;
    let references: string[];

    switch (focus) {
      case "ideas":
        answer = result.ideaManagement.narrative;
        references = result.ideaManagement.ideas.slice(0, max).map((idea) => idea.narrative);
        break;
      case "rd":
        answer = result.researchDevelopment.narrative;
        references = result.researchDevelopment.initiatives.slice(0, max).map((item) => item.narrative);
        break;
      case "product":
        answer = result.productServiceInnovation.narrative;
        references = result.productServiceInnovation.innovations.slice(0, max).map((item) => item.narrative);
        break;
      case "process":
        answer = result.processInnovation.narrative;
        references = result.processInnovation.processes.slice(0, max).map((item) => item.narrative);
        break;
      case "ai":
        answer = result.aiOpportunity.narrative;
        references = result.aiOpportunity.opportunities.slice(0, max).map((item) => item.narrative);
        break;
      case "adoption":
        answer = result.technologyAdoption.narrative;
        references = result.technologyAdoption.technologies.slice(0, max).map((item) => item.narrative);
        break;
      case "emerging":
        answer = result.emergingTechnology.narrative;
        references = result.emergingTechnology.technologies.slice(0, max).map((item) => item.narrative);
        break;
      case "portfolio":
        answer = result.innovationPortfolioSuite.narrative;
        references = result.innovationPortfolioSuite.items.slice(0, max).map((item) => item.narrative);
        break;
      case "experiments":
        answer = result.experimentManagement.narrative;
        references = result.experimentManagement.experiments.slice(0, max).map((item) => item.narrative);
        break;
      case "poc":
        answer = result.proofOfConcept.narrative;
        references = result.proofOfConcept.pocs.slice(0, max).map((item) => item.narrative);
        break;
      case "ip":
        answer = result.intellectualProperty.narrative;
        references = result.intellectualProperty.assets.slice(0, max).map((item) => item.narrative);
        break;
      case "improvement":
        answer = result.continuousImprovement.narrative;
        references = result.continuousImprovement.opportunities.slice(0, max).map((item) => item.narrative);
        break;
      case "roadmap":
        answer = result.strategicRoadmap.narrative;
        references = result.strategicRoadmap.milestones.slice(0, max).map((item) => item.narrative);
        break;
      case "recommendations":
        answer = `Innovation recommendations (${result.recommendations.length}).`;
        references = result.recommendations.slice(0, max).map((recommendation) => recommendation.title);
        break;
      case "reasoning":
        answer = result.reasoning.answer;
        references = result.reasoning.connectedIdeas.slice(0, max);
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
