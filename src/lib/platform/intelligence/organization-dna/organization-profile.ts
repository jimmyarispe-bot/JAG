/**
 * OrganizationProfile builder + OrganizationalScore / priorities / KPIs (Sprint 030).
 */

import type {
  ExecutivePrioritiesBuilder as ExecutivePrioritiesBuilderContract,
  KpiRecommendationsBuilder as KpiRecommendationsBuilderContract,
  OrganizationProfileBuilder as OrganizationProfileBuilderContract,
  OrganizationalScoreBuilder as OrganizationalScoreBuilderContract,
} from "@/lib/platform/intelligence/organization-dna/contracts";
import {
  readinessFromScore,
  clamp,
} from "@/lib/platform/intelligence/organization-dna/models";
import type {
  BusinessModel,
  CompanyBuilderSeed,
  CompanyReadinessAssessment,
  CustomerPersona,
  ExecutivePriority,
  KpiRecommendation,
  OrganizationCapabilities,
  OrganizationConstraints,
  OrganizationCulture,
  OrganizationDnaBaseline,
  OrganizationMission,
  OrganizationProfile,
  OrganizationStage,
  OrganizationValues,
  OrganizationVision,
  OrganizationalGoals,
  OrganizationalScore,
  ReadinessScoring,
  SwotAnalysis,
} from "@/lib/platform/intelligence/organization-dna/types";

export class OrganizationProfileBuilderImpl
  implements OrganizationProfileBuilderContract
{
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    mission: OrganizationMission;
    vision: OrganizationVision;
    values: OrganizationValues;
    culture: OrganizationCulture;
    goals: OrganizationalGoals;
    constraints: OrganizationConstraints;
    capabilities: OrganizationCapabilities;
    personas: CustomerPersona[];
    createId: (prefix: string) => string;
    now: Date;
  }): OrganizationProfile {
    void input.now;
    const seed = input.seed;
    return {
      id: input.createId("profile"),
      name: seed.name ?? "New Organization",
      legalName: seed.legalName ?? null,
      industry: seed.industry ?? "education",
      sector: seed.sector ?? "schools",
      geography: seed.geography ?? "local",
      foundingYear: seed.foundingYear ?? null,
      stage: input.stage,
      mission: input.mission,
      vision: input.vision,
      values: input.values,
      culture: input.culture,
      goals: input.goals,
      constraints: input.constraints,
      capabilities: input.capabilities,
      personas: input.personas,
      narrative: `${seed.name ?? "Organization"} profile at ${input.stage} stage.`,
    };
  }
}

export class OrganizationalScoreBuilderImpl
  implements OrganizationalScoreBuilderContract
{
  build(input: {
    baseline: OrganizationDnaBaseline;
    readiness: CompanyReadinessAssessment;
    scoring: ReadinessScoring;
    stage: OrganizationStage;
  }): OrganizationalScore {
    void input.stage;
    const identity = input.baseline.missionClarity;
    const market = input.baseline.marketClarity;
    const model = input.baseline.modelClarity;
    const readiness = input.readiness.overallScore;
    const execution = input.baseline.executionReadiness;
    const overall = clamp(
      Math.round((identity + market + model + readiness + execution) / 5),
      0,
      100
    );

    return {
      overall,
      identity,
      market,
      model,
      readiness,
      execution,
      status: readinessFromScore(overall),
      narrative: `Organizational score ${overall} (${readinessFromScore(overall)}).`,
    };
  }
}

export class ExecutivePrioritiesBuilderImpl
  implements ExecutivePrioritiesBuilderContract
{
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    readiness: CompanyReadinessAssessment;
    swot: SwotAnalysis;
    createId: (prefix: string) => string;
    now: Date;
  }): ExecutivePriority[] {
    void input.now;
    const priorities: ExecutivePriority[] = [
      {
        id: input.createId("priority"),
        title: "Ratify Organizational DNA",
        rationale: "Shared identity is the substrate for all intelligence modules",
        priority: "critical",
        horizon: "immediate",
        ownerRole: "Founder / CEO",
        relatedStage: input.stage,
      },
    ];

    for (const blocker of input.readiness.blockers.slice(0, 3)) {
      priorities.push({
        id: input.createId("priority"),
        title: blocker,
        rationale: "Readiness gap blocking stage progression",
        priority: "high",
        horizon: "near",
        ownerRole: "Operator",
        relatedStage: input.stage,
      });
    }

    for (const action of input.swot.priorityActions.slice(0, 2)) {
      priorities.push({
        id: input.createId("priority"),
        title: action,
        rationale: "SWOT-driven executive action",
        priority: "medium",
        horizon: "mid",
        ownerRole: "Executive team",
        relatedStage: input.stage,
      });
    }

    return priorities;
  }
}

export class KpiRecommendationsBuilderImpl
  implements KpiRecommendationsBuilderContract
{
  build(input: {
    stage: OrganizationStage;
    businessModel: BusinessModel;
    createId: (prefix: string) => string;
    now: Date;
  }): KpiRecommendation[] {
    void input.now;
    const stage = input.stage;
    const base: Array<Omit<KpiRecommendation, "id">> = [
      {
        key: "readiness_score",
        label: "Company readiness score",
        domain: "dna",
        rationale: "Primary gate for stage progression",
        targetHint: "80+",
        priority: "critical",
        stageRelevance: [
          "idea",
          "startup",
          "operating",
          "growth",
          "turnaround",
          "acquisition",
          "exit",
        ],
      },
      {
        key: "mission_clarity",
        label: "Mission clarity index",
        domain: "identity",
        rationale: "DNA identity strength",
        targetHint: "75+",
        priority: "high",
        stageRelevance: ["idea", "startup", "operating", "growth"],
      },
      {
        key: "beachhead_conversion",
        label: "Beachhead conversion",
        domain: "market",
        rationale: "Go-to-market traction",
        targetHint: stage === "idea" ? "discovery complete" : "improving MoM",
        priority: "high",
        stageRelevance: ["idea", "startup", "growth"],
      },
      {
        key: "runway_months",
        label: "Runway (months)",
        domain: "finance",
        rationale: "Capital adequacy",
        targetHint: "6+",
        priority: "high",
        stageRelevance: ["idea", "startup", "turnaround", "growth"],
      },
      {
        key: "operating_cadence",
        label: "Weekly scorecard completion",
        domain: "operations",
        rationale: "Execution discipline",
        targetHint: "100%",
        priority: "medium",
        stageRelevance: ["operating", "growth", "turnaround"],
      },
      {
        key: "revenue_health",
        label: "Primary revenue stream health",
        domain: "finance",
        rationale: `Track ${input.businessModel.revenueModel.primaryKind} performance`,
        targetHint: "on plan",
        priority: "high",
        stageRelevance: ["operating", "growth", "acquisition", "exit"],
      },
    ];

    return base
      .filter((k) => k.stageRelevance.includes(stage))
      .map((k) => ({
        id: input.createId("kpi"),
        ...k,
      }));
  }
}

export {
  OrganizationProfileBuilderImpl as OrganizationProfile,
  OrganizationProfileBuilderImpl as OrganizationProfileBuilder,
};
export {
  OrganizationalScoreBuilderImpl as OrganizationalScore,
  OrganizationalScoreBuilderImpl as OrganizationalScoreBuilder,
};
export {
  ExecutivePrioritiesBuilderImpl as ExecutivePriorities,
  ExecutivePrioritiesBuilderImpl as ExecutivePrioritiesBuilder,
};
export {
  KpiRecommendationsBuilderImpl as KpiRecommendations,
  KpiRecommendationsBuilderImpl as KpiRecommendationsBuilder,
};
