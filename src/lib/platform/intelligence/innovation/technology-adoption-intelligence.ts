/**
 * Technology Adoption Intelligence — adoption readiness and friction.
 */

import type { TechnologyAdoptionIntelligence as TechnologyAdoptionIntelligenceContract } from "@/lib/platform/intelligence/innovation/contracts";
import { clamp } from "@/lib/platform/intelligence/innovation/models";
import type {
  AiOpportunitySuite,
  InnovationBaseline,
  TechnologyAdoptionRecord,
  TechnologyAdoptionSuite,
} from "@/lib/platform/intelligence/innovation/types";

const TECH_TEMPLATES = [
  { technology: "Unified identity and SSO platform", adoptionStage: "rolling_out" },
  { technology: "Learning analytics data warehouse", adoptionStage: "pilot" },
  { technology: "Low-code workflow automation", adoptionStage: "expanding" },
  { technology: "Secure document AI copilots", adoptionStage: "assessing" },
  { technology: "Cloud campus operations stack", adoptionStage: "pilot" },
];

export class TechnologyAdoptionIntelligence implements TechnologyAdoptionIntelligenceContract {
  assess(input: {
    baseline: InnovationBaseline;
    aiOpportunity: AiOpportunitySuite;
    now: Date;
    createId: (prefix: string) => string;
  }): TechnologyAdoptionSuite {
    const { baseline, aiOpportunity, createId } = input;
    void input.now;
    const technologies: TechnologyAdoptionRecord[] = TECH_TEMPLATES.map((template, index) => {
      const readiness = clamp(
        baseline.technologyAdoptionReadiness + (index % 3) * 4 - (template.adoptionStage === "assessing" ? 8 : 0)
      );
      const riskScore = clamp(
        100 - readiness * 0.7 + index * 3 - aiOpportunity.feasibilityIndex * 0.15
      );
      return {
        id: createId("inn-adoption"),
        technology: template.technology,
        readiness,
        adoptionStage: template.adoptionStage,
        riskScore,
        narrative: `${template.technology} readiness ${Math.round(readiness)} (${template.adoptionStage}).`,
      };
    });
    const readinessScore = clamp(
      technologies.reduce((sum, item) => sum + item.readiness, 0) / technologies.length
    );
    const adoptionVelocity = clamp(
      readinessScore * 0.55 + baseline.executionScore * 0.25 + aiOpportunity.feasibilityIndex * 0.2
    );
    const frictionPressure = clamp(
      technologies.reduce((sum, item) => sum + item.riskScore, 0) / technologies.length
    );

    return {
      technologies,
      readinessScore,
      adoptionVelocity,
      frictionPressure,
      narrative: `Technology adoption readiness ${Math.round(readinessScore)}; friction ${Math.round(frictionPressure)}.`,
    };
  }
}
