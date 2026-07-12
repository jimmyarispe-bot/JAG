/**
 * ExecutiveRoadmap + OrganizationBlueprint (Sprint 030).
 */

import type {
  ExecutiveRoadmapBuilder as ExecutiveRoadmapBuilderContract,
  OrganizationBlueprintBuilder as OrganizationBlueprintBuilderContract,
} from "@/lib/platform/intelligence/organization-dna/contracts";
import { nextStage as computeNext } from "@/lib/platform/intelligence/organization-dna/models";
import type {
  CompanyBuilderSeed,
  CompanyReadinessAssessment,
  ExecutiveRoadmap,
  OrganizationBlueprint,
  OrganizationCapabilities,
  OrganizationProfile,
  OrganizationStage,
  ValueProposition,
} from "@/lib/platform/intelligence/organization-dna/types";

export class ExecutiveRoadmapBuilderImpl
  implements ExecutiveRoadmapBuilderContract
{
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    nextStage: OrganizationStage | null;
    readiness: CompanyReadinessAssessment;
    createId: (prefix: string) => string;
    now: Date;
  }): ExecutiveRoadmap {
    void input.now;
    const next = input.nextStage ?? computeNext(input.stage);
    const milestones = [
      {
        id: input.createId("milestone"),
        title: "Lock Organizational DNA",
        stage: input.stage,
        horizon: "30 days",
        priority: "high" as const,
        ownerRole: "Founder / CEO",
        successMetric: "Approved DNA + blueprint",
        dependencies: [],
      },
      {
        id: input.createId("milestone"),
        title: "Close top readiness gaps",
        stage: input.stage,
        horizon: "60 days",
        priority: "high" as const,
        ownerRole: "Operator",
        successMetric: `Readiness ≥ ${Math.min(90, input.readiness.overallScore + 10)}`,
        dependencies: ["Lock Organizational DNA"],
      },
      {
        id: input.createId("milestone"),
        title: next
          ? `Prepare transition toward ${next}`
          : "Sustain exit / succession posture",
        stage: next ?? input.stage,
        horizon: "180 days",
        priority: "medium" as const,
        ownerRole: "Executive team",
        successMetric: next
          ? `${next} stage checklist green`
          : "Succession packet complete",
        dependencies: ["Close top readiness gaps"],
      },
    ];

    return {
      currentStage: input.stage,
      nextStage: next,
      milestones,
      priorities: [
        ...input.readiness.blockers.slice(0, 3),
        "Maintain shared DNA across leadership",
      ],
      narrative: `Executive roadmap from ${input.stage}${next ? ` toward ${next}` : ""}.`,
    };
  }
}

export class OrganizationBlueprintBuilderImpl
  implements OrganizationBlueprintBuilderContract
{
  build(input: {
    seed: CompanyBuilderSeed;
    profile: OrganizationProfile;
    stage: OrganizationStage;
    valueProposition: ValueProposition;
    capabilities: OrganizationCapabilities;
    readiness: CompanyReadinessAssessment;
    now: Date;
  }): OrganizationBlueprint {
    void input.now;
    const gaps = input.capabilities.capabilities
      .filter((c) => c.maturity < 60)
      .map((c) => c.name);

    return {
      title: `${input.profile.name} Executive Blueprint`,
      stage: input.stage,
      mission: input.profile.mission.statement,
      vision: input.profile.vision.statement,
      valueProposition: input.valueProposition.statement,
      operatingModel: `${input.profile.culture.style} culture with ${input.profile.culture.decisionStyle}`,
      orgDesignHints: [
        "Founder/CEO owns DNA and stage progression",
        "Operator owns weekly scorecard cadence",
        "Board/governance consumes DNA-derived priorities when active",
      ],
      capabilityGaps: gaps.length ? gaps : ["No critical capability gaps flagged"],
      first90Days: [
        "Approve Organizational DNA and blueprint",
        "Install KPI recommendations",
        ...input.readiness.blockers.slice(0, 2),
      ],
      narrative: `Blueprint for ${input.stage} stage (readiness ${input.readiness.status}).`,
    };
  }
}

export {
  ExecutiveRoadmapBuilderImpl as ExecutiveRoadmap,
  ExecutiveRoadmapBuilderImpl as ExecutiveRoadmapBuilder,
};
export {
  OrganizationBlueprintBuilderImpl as OrganizationBlueprint,
  OrganizationBlueprintBuilderImpl as OrganizationBlueprintBuilder,
};
