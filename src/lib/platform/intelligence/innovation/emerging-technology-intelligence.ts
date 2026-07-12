/**
 * Emerging Technology Intelligence — foresight watchlist and disruption.
 */

import type { EmergingTechnologyIntelligence as EmergingTechnologyIntelligenceContract } from "@/lib/platform/intelligence/innovation/contracts";
import { clamp } from "@/lib/platform/intelligence/innovation/models";
import type {
  EmergingTechnologyRecord,
  EmergingTechnologySuite,
  InnovationBaseline,
  InnovationHorizon,
  TechnologyAdoptionSuite,
} from "@/lib/platform/intelligence/innovation/types";

const EMERGING_TEMPLATES: Array<{ technology: string; horizonFit: InnovationHorizon }> = [
  { technology: "Multimodal generative agents for tutoring", horizonFit: "h3_transformational" },
  { technology: "Digital twin campus operations", horizonFit: "h3_transformational" },
  { technology: "Neuroadaptive assessment", horizonFit: "h2_adjacent" },
  { technology: "Credentialing on verifiable credentials", horizonFit: "h2_adjacent" },
  { technology: "Ambient classroom sensing (privacy-safe)", horizonFit: "h3_transformational" },
];

export class EmergingTechnologyIntelligence implements EmergingTechnologyIntelligenceContract {
  assess(input: {
    baseline: InnovationBaseline;
    technologyAdoption: TechnologyAdoptionSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): EmergingTechnologySuite {
    const { baseline, technologyAdoption, createId } = input;
    void input.now;
    const technologies: EmergingTechnologyRecord[] = EMERGING_TEMPLATES.map((template, index) => {
      const awareness = clamp(
        baseline.emergingTechAwareness + (index % 3) * 5 - index * 2
      );
      const disruptionPotential = clamp(
        awareness * 0.5 +
          baseline.marketSignalStrength * 0.25 +
          (100 - technologyAdoption.readinessScore) * 0.15 +
          index * 3
      );
      return {
        id: createId("inn-emerging"),
        technology: template.technology,
        awareness,
        disruptionPotential,
        horizonFit: template.horizonFit,
        narrative: `${template.technology} awareness ${Math.round(awareness)}, disruption ${Math.round(disruptionPotential)}.`,
      };
    });
    const awarenessScore = clamp(
      technologies.reduce((sum, item) => sum + item.awareness, 0) / technologies.length
    );
    const disruptionIndex = clamp(
      technologies.reduce((sum, item) => sum + item.disruptionPotential, 0) / technologies.length
    );
    const watchlistCount = technologies.filter((item) => item.awareness >= 50).length;

    return {
      technologies,
      awarenessScore,
      disruptionIndex,
      watchlistCount,
      narrative: `Emerging tech awareness ${Math.round(awarenessScore)}; watchlist ${watchlistCount}.`,
    };
  }
}
