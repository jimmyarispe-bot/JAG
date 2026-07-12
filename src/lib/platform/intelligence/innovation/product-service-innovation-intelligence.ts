/**
 * Product / Service Innovation Intelligence — novelty and launch readiness.
 */

import type { ProductServiceInnovationIntelligence as ProductServiceInnovationIntelligenceContract } from "@/lib/platform/intelligence/innovation/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/innovation/models";
import type {
  InnovationBaseline,
  ProductServiceInnovationRecord,
  ProductServiceInnovationSuite,
  ResearchDevelopmentSuite,
} from "@/lib/platform/intelligence/innovation/types";

const PRODUCT_TEMPLATES: Array<{ name: string; type: "product" | "service" }> = [
  { name: "Personalized learning pathway pack", type: "product" },
  { name: "Family success concierge service", type: "service" },
  { name: "Teacher co-design toolkit", type: "product" },
  { name: "Employer internship brokerage", type: "service" },
  { name: "Modular after-school enrichment suite", type: "product" },
];

export class ProductServiceInnovationIntelligence implements ProductServiceInnovationIntelligenceContract {
  assess(input: {
    baseline: InnovationBaseline;
    researchDevelopment: ResearchDevelopmentSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): ProductServiceInnovationSuite {
    const { baseline, researchDevelopment, createId } = input;
    void input.now;
    const innovations: ProductServiceInnovationRecord[] = PRODUCT_TEMPLATES.map((template, index) => {
      const noveltyScore = clamp(
        baseline.productInnovationScore + (index % 3) * 4 + researchDevelopment.intensityScore * 0.1
      );
      const readiness = clamp(
        baseline.executionScore * 0.45 + noveltyScore * 0.35 + baseline.businessModelFit * 0.2 - index * 2
      );
      return {
        id: createId("inn-product"),
        name: template.name,
        type: template.type,
        noveltyScore,
        readiness,
        narrative: `${template.name} novelty ${Math.round(noveltyScore)}, readiness ${Math.round(readiness)}.`,
        lenses: buildLens({
          innovationOpportunityExists: template.name,
          evidenceSupports: `Product innovation score ${Math.round(baseline.productInnovationScore)}.`,
          problemSolved: `Strengthens ${template.type} offering differentiation.`,
          expectedImpact: `Novelty ${Math.round(noveltyScore)} with launch readiness ${Math.round(readiness)}.`,
          investmentRequired: "Design, staffing, and go-to-market investment.",
          experimentsValidate: "Pilot cohorts and readiness gates.",
          risksExist: "Adoption lag and resource contention.",
          capabilitiesRequired: "Product design, operations, advancement",
        }),
      };
    });
    const innovationScore = clamp(
      innovations.reduce((sum, item) => sum + item.noveltyScore, 0) / innovations.length
    );
    const noveltyIndex = clamp(
      innovationScore * 0.6 + researchDevelopment.pipelineDepth * 0.4
    );
    const launchReadiness = clamp(
      innovations.reduce((sum, item) => sum + item.readiness, 0) / innovations.length
    );

    return {
      innovations,
      innovationScore,
      noveltyIndex,
      launchReadiness,
      narrative: `Product/service innovation ${Math.round(innovationScore)}; launch readiness ${Math.round(launchReadiness)}.`,
    };
  }
}
