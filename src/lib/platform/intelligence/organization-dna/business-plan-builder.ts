/**
 * BusinessPlanBuilder (Sprint 030).
 */

import type { BusinessPlanBuilder as BusinessPlanBuilderContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import type {
  BusinessModel,
  BusinessPlan,
  CompanyBuilderSeed,
  CompanyReadinessAssessment,
  ExecutiveRoadmap,
  GoToMarketPlan,
  OrganizationProfile,
  SwotAnalysis,
} from "@/lib/platform/intelligence/organization-dna/types";

export class BusinessPlanBuilderImpl implements BusinessPlanBuilderContract {
  build(input: {
    seed: CompanyBuilderSeed;
    profile: OrganizationProfile;
    businessModel: BusinessModel;
    goToMarket: GoToMarketPlan;
    readiness: CompanyReadinessAssessment;
    roadmap: ExecutiveRoadmap;
    swot: SwotAnalysis;
    now: Date;
  }): BusinessPlan {
    void input.now;
    const seed = input.seed;
    return {
      executiveSummary: `${input.profile.name} is a ${input.profile.stage}-stage ${
        input.profile.industry
      } organization. Mission: ${input.profile.mission.statement}`,
      marketOpportunity: `Serve ${seed.targetCustomer ?? "target customers"} in ${
        seed.geography ?? "target geography"
      } with ${seed.solutionSummary ?? "a differentiated offering"}.`,
      offering: input.businessModel.valueProposition.statement,
      goToMarket: `${input.goToMarket.beachhead}; channels: ${input.goToMarket.channels
        .map((c) => c.name)
        .join(", ")}.`,
      operations: `Operate with readiness status ${input.readiness.status} (score ${input.readiness.overallScore}).`,
      financialOutlook: input.businessModel.revenueModel.unitEconomics,
      risks: input.swot.threats.slice(0, 4),
      milestones: input.roadmap.milestones.map((m) => m.title),
      narrative: "Business plan summary assembled from DNA artifacts.",
    };
  }
}

export { BusinessPlanBuilderImpl as BusinessPlanBuilder };
