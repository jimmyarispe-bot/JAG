/**
 * Process Innovation Intelligence — operational process improvement.
 */

import type { ProcessInnovationIntelligence as ProcessInnovationIntelligenceContract } from "@/lib/platform/intelligence/innovation/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/innovation/models";
import type {
  InnovationBaseline,
  ProcessInnovationRecord,
  ProcessInnovationSuite,
  ProductServiceInnovationSuite,
} from "@/lib/platform/intelligence/innovation/types";

const PROCESS_TEMPLATES = [
  { process: "Enrollment workflow automation" },
  { process: "Staff onboarding digital journey" },
  { process: "Procurement cycle compression" },
  { process: "Incident response playbooks" },
  { process: "Curriculum revision cadence" },
];

export class ProcessInnovationIntelligence implements ProcessInnovationIntelligenceContract {
  assess(input: {
    baseline: InnovationBaseline;
    productServiceInnovation: ProductServiceInnovationSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): ProcessInnovationSuite {
    const { baseline, productServiceInnovation, createId } = input;
    void input.now;
    const processes: ProcessInnovationRecord[] = PROCESS_TEMPLATES.map((template, index) => {
      const efficiencyGain = clamp(
        baseline.processInnovationScore + (index % 4) * 3 - 4
      );
      const adoptionScore = clamp(
        baseline.improvementMomentum * 0.5 + efficiencyGain * 0.35 + baseline.executionScore * 0.15
      );
      return {
        id: createId("inn-process"),
        process: template.process,
        efficiencyGain,
        adoptionScore,
        narrative: `${template.process} efficiency ${Math.round(efficiencyGain)}, adoption ${Math.round(adoptionScore)}.`,
        lenses: buildLens({
          innovationOpportunityExists: template.process,
          evidenceSupports: `Process innovation score ${Math.round(baseline.processInnovationScore)}.`,
          problemSolved: "Reduces friction and cycle time in core operations.",
          expectedImpact: `Efficiency gain ${Math.round(efficiencyGain)}.`,
          investmentRequired: "Change management and tooling investment.",
          experimentsValidate: "Process A/B trials and adoption checkpoints.",
          risksExist: "Change resistance and training gaps.",
          capabilitiesRequired: "Operations, people, continuous improvement",
        }),
      };
    });
    const innovationScore = clamp(
      processes.reduce((sum, item) => sum + item.efficiencyGain, 0) / processes.length
    );
    const efficiencyIndex = clamp(
      innovationScore * 0.55 + productServiceInnovation.launchReadiness * 0.2 + baseline.improvementMomentum * 0.25
    );
    const adoptionPressure = clamp(
      100 -
        processes.reduce((sum, item) => sum + item.adoptionScore, 0) / Math.max(1, processes.length)
    );

    return {
      processes,
      innovationScore,
      efficiencyIndex,
      adoptionPressure,
      narrative: `Process innovation ${Math.round(innovationScore)}; efficiency index ${Math.round(efficiencyIndex)}.`,
    };
  }
}
