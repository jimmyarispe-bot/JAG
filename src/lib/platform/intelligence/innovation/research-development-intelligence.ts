/**
 * Research & Development Intelligence — R&D intensity and pipeline depth.
 */

import type { ResearchDevelopmentIntelligence as ResearchDevelopmentIntelligenceContract } from "@/lib/platform/intelligence/innovation/contracts";
import { clamp } from "@/lib/platform/intelligence/innovation/models";
import type {
  IdeaManagementSuite,
  InnovationBaseline,
  RdInitiativeRecord,
  ResearchDevelopmentSuite,
} from "@/lib/platform/intelligence/innovation/types";

const RD_TEMPLATES = [
  { name: "Learning science lab", maturity: "applied" },
  { name: "EdTech prototyping studio", maturity: "experimental" },
  { name: "Operations automation R&D", maturity: "pilot" },
  { name: "Assessment innovation cell", maturity: "applied" },
  { name: "AI pedagogy research track", maturity: "emerging" },
];

export class ResearchDevelopmentIntelligence implements ResearchDevelopmentIntelligenceContract {
  assess(input: {
    baseline: InnovationBaseline;
    ideaManagement: IdeaManagementSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): ResearchDevelopmentSuite {
    const { baseline, ideaManagement, createId } = input;
    void input.now;
    const initiatives: RdInitiativeRecord[] = RD_TEMPLATES.map((template, index) => {
      const intensity = clamp(
        baseline.rdIntensity + (index % 3) * 5 - (template.maturity === "emerging" ? 4 : 0)
      );
      return {
        id: createId("inn-rd"),
        name: template.name,
        intensity,
        maturity: template.maturity,
        investmentIndex: clamp(intensity * 0.7 + baseline.executionScore * 0.3),
        narrative: `${template.name} intensity ${Math.round(intensity)} (${template.maturity}).`,
      };
    });
    const intensityScore = clamp(
      initiatives.reduce((sum, initiative) => sum + initiative.intensity, 0) / initiatives.length
    );
    const pipelineDepth = clamp(
      intensityScore * 0.55 + ideaManagement.velocityScore * 0.3 + baseline.knowledgeContributionScore * 0.15
    );
    const capabilityCoverage = clamp(
      baseline.documentInnovationCoverage * 0.4 + intensityScore * 0.35 + baseline.businessModelFit * 0.25
    );

    return {
      initiatives,
      intensityScore,
      pipelineDepth,
      capabilityCoverage,
      narrative: `R&D intensity ${Math.round(intensityScore)} across ${initiatives.length} initiatives; pipeline depth ${Math.round(pipelineDepth)}.`,
    };
  }
}
