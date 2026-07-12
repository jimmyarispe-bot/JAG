/**
 * Innovation to knowledge contribution intelligence.
 */

import type { InnovationKnowledgeContributionEngine as InnovationKnowledgeContributionEngineContract } from "@/lib/platform/intelligence/innovation/contracts";
import { clamp } from "@/lib/platform/intelligence/innovation/models";
import type {
  ExperimentManagementSuite,
  IdeaManagementSuite,
  InnovationBaseline,
  InnovationKnowledgeContribution,
  InnovationKnowledgeDraft,
  InnovationPortfolioSuite,
  StrategicRoadmapSuite,
} from "@/lib/platform/intelligence/innovation/types";

export class InnovationKnowledgeContributionEngine implements InnovationKnowledgeContributionEngineContract {
  contribute(input: {
    baseline: InnovationBaseline;
    ideaManagement: IdeaManagementSuite;
    experimentManagement: ExperimentManagementSuite;
    innovationPortfolio: InnovationPortfolioSuite;
    strategicRoadmap: StrategicRoadmapSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): InnovationKnowledgeContribution {
    const {
      baseline,
      ideaManagement,
      experimentManagement,
      innovationPortfolio,
      strategicRoadmap,
      createId,
    } = input;
    void input.now;
    const groups: Array<{ group: string; artifactType: string; sourceRef: string; seed: number }> = [
      {
        group: "idea backlog",
        artifactType: "idea_knowledge",
        sourceRef: ideaManagement.ideas[0]?.id ?? "ideas",
        seed: ideaManagement.velocityScore,
      },
      {
        group: "experiment learning",
        artifactType: "experiment_knowledge",
        sourceRef: experimentManagement.experiments[0]?.id ?? "experiments",
        seed: experimentManagement.throughputScore,
      },
      {
        group: "portfolio allocation",
        artifactType: "portfolio_knowledge",
        sourceRef: innovationPortfolio.items[0]?.id ?? "portfolio",
        seed: innovationPortfolio.balanceScore,
      },
      {
        group: "strategic roadmap",
        artifactType: "roadmap_knowledge",
        sourceRef: strategicRoadmap.milestones[0]?.id ?? "roadmap",
        seed: strategicRoadmap.clarityScore,
      },
    ];
    const artifacts: InnovationKnowledgeDraft[] = groups.map((group) => {
      const confidence = clamp(baseline.knowledgeContributionScore * 0.55 + group.seed * 0.45);
      return {
        id: createId("inn-knowledge"),
        type: group.artifactType,
        title: `${group.group} knowledge`,
        confidence,
        sourceRef: group.sourceRef,
        validated: confidence >= 60,
        metadata: { group: group.group, portfolioBalance: innovationPortfolio.balanceScore },
      };
    });
    const validatedCount = artifacts.filter((artifact) => artifact.validated).length;
    const contributionScore = clamp(
      baseline.knowledgeContributionScore * 0.7 + (validatedCount / Math.max(1, artifacts.length)) * 30
    );

    return {
      artifacts,
      contributionScore,
      validatedCount,
      narrative: `Innovation knowledge contribution ${Math.round(contributionScore)} with ${validatedCount} validated drafts.`,
    };
  }
}
