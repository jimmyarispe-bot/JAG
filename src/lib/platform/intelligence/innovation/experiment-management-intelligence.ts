/**
 * Experiment Management Intelligence — experiment throughput and learning.
 */

import type { ExperimentManagementIntelligence as ExperimentManagementIntelligenceContract } from "@/lib/platform/intelligence/innovation/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/innovation/models";
import type {
  ExperimentManagementSuite,
  ExperimentRecord,
  ExperimentStatus,
  IdeaManagementSuite,
  InnovationBaseline,
  InnovationPortfolioSuite,
} from "@/lib/platform/intelligence/innovation/types";

const EXPERIMENT_TEMPLATES: Array<{ name: string; status: ExperimentStatus }> = [
  { name: "AI lesson planning pilot A/B", status: "running" },
  { name: "Family portal conversion experiment", status: "completed" },
  { name: "Shared services demand test", status: "planned" },
  { name: "Staff micro-credential cohort", status: "running" },
  { name: "Energy optimization campus trial", status: "scaled" },
  { name: "AR tour engagement test", status: "failed" },
];

export class ExperimentManagementIntelligence implements ExperimentManagementIntelligenceContract {
  assess(input: {
    baseline: InnovationBaseline;
    ideaManagement: IdeaManagementSuite;
    innovationPortfolio: InnovationPortfolioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): ExperimentManagementSuite {
    const { baseline, ideaManagement, innovationPortfolio, createId } = input;
    void input.now;
    const count = Math.max(4, Math.min(EXPERIMENT_TEMPLATES.length, baseline.experimentCount + 2));
    const experiments: ExperimentRecord[] = EXPERIMENT_TEMPLATES.slice(0, count).map((template, index) => {
      const throughputContribution = clamp(
        baseline.experimentThroughput +
          (template.status === "running" || template.status === "scaled" ? 8 : 0) -
          (template.status === "failed" ? 10 : 0) +
          (index % 3) * 3
      );
      const learningValue = clamp(
        throughputContribution * 0.6 + ideaManagement.velocityScore * 0.25 + innovationPortfolio.balanceScore * 0.15
      );
      return {
        id: createId("inn-experiment"),
        name: template.name,
        status: template.status,
        throughputContribution,
        learningValue,
        narrative: `${template.name} (${template.status}) learning ${Math.round(learningValue)}.`,
        lenses: buildLens({
          innovationOpportunityExists: template.name,
          evidenceSupports: `Experiment throughput ${Math.round(baseline.experimentThroughput)}.`,
          problemSolved: "Validates innovation hypotheses before scale.",
          expectedImpact: `Learning value ${Math.round(learningValue)}.`,
          investmentRequired: "Pilot staffing and instrumentation.",
          experimentsValidate: template.name,
          risksExist: "False positives and incomplete learning capture.",
          capabilitiesRequired: "Experiment design, analytics, domain owners",
        }),
      };
    });
    const throughputScore = clamp(
      experiments.reduce((sum, item) => sum + item.throughputContribution, 0) / experiments.length
    );
    const runningCount = experiments.filter((item) => item.status === "running").length;
    const completedLike = experiments.filter(
      (item) => item.status === "completed" || item.status === "scaled"
    ).length;
    const finished = experiments.filter(
      (item) => item.status === "completed" || item.status === "scaled" || item.status === "failed"
    ).length;
    const successRate = clamp((completedLike / Math.max(1, finished)) * 100);

    return {
      experiments,
      throughputScore,
      runningCount,
      successRate,
      narrative: `Experiment throughput ${Math.round(throughputScore)}; ${runningCount} running; success ${Math.round(successRate)}%.`,
    };
  }
}
