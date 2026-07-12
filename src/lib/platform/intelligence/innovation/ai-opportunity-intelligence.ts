/**
 * AI Opportunity Intelligence — AI use-case discovery and prioritization.
 */

import type { AiOpportunityIntelligence as AiOpportunityIntelligenceContract } from "@/lib/platform/intelligence/innovation/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/innovation/models";
import type {
  AiOpportunityRecord,
  AiOpportunitySuite,
  InnovationBaseline,
  ProcessInnovationSuite,
} from "@/lib/platform/intelligence/innovation/types";

const AI_TEMPLATES = [
  { opportunity: "Automated transcript and records summarization" },
  { opportunity: "Intelligent tutoring support for core subjects" },
  { opportunity: "Predictive attrition / engagement alerts" },
  { opportunity: "AI drafting for board and family communications" },
  { opportunity: "Operations ticket triage and routing" },
];

export class AiOpportunityIntelligence implements AiOpportunityIntelligenceContract {
  assess(input: {
    baseline: InnovationBaseline;
    processInnovation: ProcessInnovationSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): AiOpportunitySuite {
    const { baseline, processInnovation, createId } = input;
    void input.now;
    const opportunities: AiOpportunityRecord[] = AI_TEMPLATES.map((template, index) => {
      const density = clamp(
        baseline.aiOpportunityDensity + (index % 3) * 5 - index
      );
      const feasibility = clamp(
        baseline.technologyAdoptionReadiness * 0.45 +
          density * 0.3 +
          processInnovation.efficiencyIndex * 0.25 -
          index * 2
      );
      const impactEstimate = Math.round(density * 3_500 + feasibility * 2_000);
      return {
        id: createId("inn-ai"),
        opportunity: template.opportunity,
        density,
        feasibility,
        impactEstimate,
        narrative: `${template.opportunity} density ${Math.round(density)}, feasibility ${Math.round(feasibility)}.`,
        lenses: buildLens({
          innovationOpportunityExists: template.opportunity,
          evidenceSupports: `AI opportunity density ${Math.round(baseline.aiOpportunityDensity)}.`,
          problemSolved: "Automates high-friction knowledge and decision work.",
          expectedImpact: `Impact ~$${impactEstimate.toLocaleString()}.`,
          investmentRequired: "Model evaluation, data readiness, and change management.",
          experimentsValidate: "Scoped pilots with human-in-the-loop controls.",
          risksExist: "Data quality, privacy, and over-automation risk.",
          capabilitiesRequired: "AI ops, data stewardship, domain owners",
        }),
      };
    });
    const densityScore = clamp(
      opportunities.reduce((sum, item) => sum + item.density, 0) / opportunities.length
    );
    const feasibilityIndex = clamp(
      opportunities.reduce((sum, item) => sum + item.feasibility, 0) / opportunities.length
    );
    const priorityCount = opportunities.filter((item) => item.feasibility >= 60 && item.density >= 55).length;

    return {
      opportunities,
      densityScore,
      feasibilityIndex,
      priorityCount,
      narrative: `AI opportunity density ${Math.round(densityScore)}; ${priorityCount} priority candidates.`,
    };
  }
}
