/**
 * Continuous Improvement Intelligence — improvement opportunities and momentum.
 */

import type { ContinuousImprovementIntelligence as ContinuousImprovementIntelligenceContract } from "@/lib/platform/intelligence/innovation/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/innovation/models";
import type {
  ContinuousImprovementRecord,
  ContinuousImprovementSuite,
  ExperimentManagementSuite,
  InnovationBaseline,
  ProcessInnovationSuite,
} from "@/lib/platform/intelligence/innovation/types";

const IMPROVEMENT_TEMPLATES = [
  { opportunity: "Reduce enrollment cycle time by 20%" },
  { opportunity: "Standardize campus incident after-action reviews" },
  { opportunity: "Automate weekly academic status digests" },
  { opportunity: "Improve vendor onboarding SLA compliance" },
  { opportunity: "Raise family communication response quality" },
];

export class ContinuousImprovementIntelligence implements ContinuousImprovementIntelligenceContract {
  assess(input: {
    baseline: InnovationBaseline;
    processInnovation: ProcessInnovationSuite;
    experimentManagement: ExperimentManagementSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): ContinuousImprovementSuite {
    const { baseline, processInnovation, experimentManagement, createId } = input;
    void input.now;
    const opportunities: ContinuousImprovementRecord[] = IMPROVEMENT_TEMPLATES.map((template, index) => {
      const momentum = clamp(
        baseline.continuousImprovementMomentum + (index % 3) * 4 - index
      );
      const impactEstimate = Math.round(momentum * 2_200 + processInnovation.efficiencyIndex * 80);
      return {
        id: createId("inn-ci"),
        opportunity: template.opportunity,
        momentum,
        impactEstimate,
        narrative: `${template.opportunity} momentum ${Math.round(momentum)}.`,
        lenses: buildLens({
          innovationOpportunityExists: template.opportunity,
          evidenceSupports: `Continuous improvement momentum ${Math.round(baseline.continuousImprovementMomentum)}.`,
          problemSolved: "Compounds operational excellence through small bets.",
          expectedImpact: `Impact ~$${impactEstimate.toLocaleString()}.`,
          investmentRequired: "Team capacity and facilitation.",
          experimentsValidate: experimentManagement.experiments[0]?.name ?? "CI experiments",
          risksExist: "Initiative overload and weak sustainment.",
          capabilitiesRequired: "Continuous improvement, operations, people",
        }),
      };
    });
    const momentumScore = clamp(
      opportunities.reduce((sum, item) => sum + item.momentum, 0) / opportunities.length
    );
    const throughputIndex = clamp(
      momentumScore * 0.55 +
        processInnovation.innovationScore * 0.25 +
        experimentManagement.throughputScore * 0.2
    );

    return {
      opportunities,
      momentumScore,
      opportunityCount: opportunities.length,
      throughputIndex,
      narrative: `Continuous improvement momentum ${Math.round(momentumScore)} across ${opportunities.length} opportunities.`,
    };
  }
}
