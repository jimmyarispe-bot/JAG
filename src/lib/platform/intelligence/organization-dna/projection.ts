/**
 * OrganizationDnaProjection + OrganizationDnaQueries (Sprint 030).
 */

import type {
  OrganizationDnaProjection as OrganizationDnaProjectionContract,
  OrganizationDnaQueries as OrganizationDnaQueriesContract,
} from "@/lib/platform/intelligence/organization-dna/contracts";
import type {
  CompanyBuilderArtifact,
  OrganizationDNA,
  OrganizationDnaProjectionResult,
  OrganizationDnaQueryRequest,
  OrganizationDnaQueryResult,
  OrganizationDnaResult,
} from "@/lib/platform/intelligence/organization-dna/types";

export class OrganizationDnaProjectionImpl
  implements OrganizationDnaProjectionContract
{
  project(input: {
    dna: OrganizationDNA;
    artifacts: CompanyBuilderArtifact[];
  }): OrganizationDnaProjectionResult {
    const dna = input.dna;
    return {
      headline: `${dna.profile.name} — ${dna.stage} stage, readiness ${dna.readiness.status}`,
      stage: dna.stage,
      readinessStatus: dna.readiness.status,
      organizationalScore: dna.score.overall,
      topPriorities: dna.priorities.slice(0, 5).map((p) => p.title),
      topKpis: dna.kpiRecommendations.slice(0, 5).map((k) => k.label),
      metrics: {
        personaCount: dna.profile.personas.length,
        milestoneCount: dna.roadmap.milestones.length,
        kpiCount: dna.kpiRecommendations.length,
        priorityCount: dna.priorities.length,
        artifactCount: input.artifacts.length,
      },
    };
  }
}

export class OrganizationDnaQueriesImpl
  implements OrganizationDnaQueriesContract
{
  ask(
    result: OrganizationDnaResult,
    request: OrganizationDnaQueryRequest
  ): OrganizationDnaQueryResult {
    const focus = request.focus ?? "general";
    const dna = result.dna;
    let answer: string;
    let references: string[];

    switch (focus) {
      case "stage":
        answer = `Current stage is ${dna.stage}${
          dna.nextStage ? `; next stage ${dna.nextStage}` : ""
        }.`;
        references = ["dna.stage", "dna.roadmap"];
        break;
      case "readiness":
        answer = `Readiness ${dna.readiness.status} (score ${dna.readiness.overallScore}). Blockers: ${
          dna.readiness.blockers.slice(0, 3).join("; ") || "none"
        }.`;
        references = ["dna.readiness", "dna.scoring"];
        break;
      case "roadmap":
        answer = `Roadmap priorities: ${dna.roadmap.priorities.slice(0, 3).join("; ")}.`;
        references = ["dna.roadmap"];
        break;
      case "model":
        answer = `Business model archetype ${dna.businessModel.archetype}. ${dna.valueProposition.statement}`;
        references = ["dna.businessModel", "dna.valueProposition"];
        break;
      case "swot":
        answer = `Top strength: ${dna.swot.strengths[0] ?? "n/a"}. Top threat: ${
          dna.swot.threats[0] ?? "n/a"
        }.`;
        references = ["dna.swot"];
        break;
      case "priorities":
        answer = dna.priorities
          .slice(0, 5)
          .map((p) => p.title)
          .join("; ");
        references = ["dna.priorities"];
        break;
      case "kpis":
        answer = dna.kpiRecommendations
          .slice(0, 5)
          .map((k) => k.label)
          .join("; ");
        references = ["dna.kpiRecommendations"];
        break;
      case "dna":
        answer = `${dna.profile.name} DNA score ${dna.score.overall}. Mission: ${dna.profile.mission.statement}`;
        references = ["dna", "dna.profile", "dna.score"];
        break;
      default:
        answer = result.projection.headline || result.recommendations[0] || dna.score.narrative;
        references = ["projection", "recommendations"];
    }

    return {
      question: request.question,
      answer,
      references,
      focus,
    };
  }
}

export {
  OrganizationDnaProjectionImpl as OrganizationDnaProjection,
};
export {
  OrganizationDnaQueriesImpl as OrganizationDnaQueries,
};
