/**
 * Innovation reasoning intelligence.
 */

import type { InnovationReasoner as InnovationReasonerContract } from "@/lib/platform/intelligence/innovation/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/innovation/models";
import type {
  ExperimentManagementSuite,
  IdeaManagementSuite,
  InnovationBaseline,
  InnovationPortfolioSuite,
  InnovationReasoningResult,
  StrategicRoadmapSuite,
} from "@/lib/platform/intelligence/innovation/types";

export class InnovationReasoner implements InnovationReasonerContract {
  reason(input: {
    baseline: InnovationBaseline;
    ideaManagement: IdeaManagementSuite;
    experimentManagement: ExperimentManagementSuite;
    innovationPortfolio: InnovationPortfolioSuite;
    strategicRoadmap: StrategicRoadmapSuite;
    question?: string;
    now: Date;
  }): InnovationReasoningResult {
    void input.now;
    const connectedIdeas = input.ideaManagement.ideas
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((idea) => idea.title);
    const connectedExperiments = input.experimentManagement.experiments
      .slice(0, 6)
      .map((experiment) => experiment.name);
    const missingTopics = [
      ...(input.ideaManagement.backlogHealth < 60 ? ["idea backlog hygiene"] : []),
      ...(input.experimentManagement.throughputScore < 60 ? ["experiment throughput"] : []),
      ...(input.innovationPortfolio.balanceScore < 60 ? ["portfolio balance"] : []),
      ...(input.strategicRoadmap.clarityScore < 60 ? ["roadmap clarity"] : []),
      ...(input.baseline.ipCoverage < 55 ? ["intellectual property coverage"] : []),
    ];
    const confidence = buildConfidence([
      { key: "ideas", label: "Idea velocity", contribution: input.ideaManagement.velocityScore / 100 },
      { key: "experiments", label: "Experiment throughput", contribution: input.experimentManagement.throughputScore / 100 },
      { key: "portfolio", label: "Portfolio balance", contribution: input.innovationPortfolio.balanceScore / 100 },
      { key: "roadmap", label: "Roadmap clarity", contribution: input.strategicRoadmap.clarityScore / 100 },
    ]);
    const answer =
      input.question ??
      `Innovation intelligence identified ${connectedIdeas.length} prioritized ideas with ${connectedExperiments.length} linked experiments and portfolio balance ${Math.round(input.innovationPortfolio.balanceScore)}.`;

    return {
      answer,
      connectedIdeas,
      connectedExperiments,
      missingTopics,
      confidence,
      narrative: `Reasoning confidence ${confidence.level}; ${connectedIdeas.length} ideas and ${connectedExperiments.length} experiments considered.`,
    };
  }
}
