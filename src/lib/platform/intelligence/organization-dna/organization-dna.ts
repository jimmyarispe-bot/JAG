/**
 * OrganizationDNA composer helpers (Sprint 030).
 */

import type { OrganizationDnaComposer as OrganizationDnaComposerContract } from "@/lib/platform/intelligence/organization-dna/contracts";
import { emptyDnaScope } from "@/lib/platform/intelligence/organization-dna/models";
import {
  ORGANIZATION_DNA_VERSION,
  type OrganizationDNA,
  type OrganizationDnaResult,
} from "@/lib/platform/intelligence/organization-dna/types";

export class OrganizationDnaComposerImpl
  implements OrganizationDnaComposerContract
{
  compose(
    input: Parameters<OrganizationDnaComposerContract["compose"]>[0]
  ): OrganizationDnaResult {
    const scope = input.request.scope ?? emptyDnaScope();
    const generatedAt = input.now.toISOString();
    const dnaId = input.createId("dna");

    const dna: OrganizationDNA = {
      id: dnaId,
      version: ORGANIZATION_DNA_VERSION,
      profileId: input.profile.id,
      stage: input.stage,
      previousStage: input.previousStage,
      nextStage: input.nextStage,
      profile: input.profile,
      businessModel: input.businessModel,
      leanCanvas: input.leanCanvas,
      swot: input.swot,
      valueProposition: input.valueProposition,
      revenueModel: input.revenueModel,
      fundingModel: input.fundingModel,
      goToMarket: input.goToMarket,
      readiness: input.readiness,
      scoring: input.scoring,
      blueprint: input.blueprint,
      roadmap: input.roadmap,
      businessPlan: input.businessPlan,
      priorities: input.priorities,
      score: input.score,
      kpiRecommendations: input.kpiRecommendations,
      confidence: input.confidence,
      generatedAt,
      scope,
      metadata: input.request.metadata ?? {},
    };

    const recommendations = [
      ...input.priorities.slice(0, 3).map((p) => p.title),
      ...input.readiness.blockers.slice(0, 2),
      `Advance readiness from ${input.readiness.status} toward ready`,
    ];

    return {
      requestId: input.request.requestId,
      version: ORGANIZATION_DNA_VERSION,
      generatedAt,
      scope,
      dna,
      profile: input.profile,
      artifacts: input.artifacts,
      projection: {
        headline: "",
        stage: input.stage,
        readinessStatus: input.readiness.status,
        organizationalScore: input.score.overall,
        topPriorities: [],
        topKpis: [],
        metrics: {
          personaCount: 0,
          milestoneCount: 0,
          kpiCount: 0,
          priorityCount: 0,
          artifactCount: 0,
        },
      },
      confidence: input.confidence,
      historyRecord: {
        id: input.createId("history"),
        requestId: input.request.requestId,
        generatedAt,
        status: "generated",
        dnaId,
        stage: input.stage,
        summary: `${input.profile.name} DNA at ${input.stage} (score ${input.score.overall})`,
        scope,
        confidence: input.confidence,
      },
      recommendations,
    };
  }
}

/** Alias for OrganizationDNA naming in the package surface. */
export { OrganizationDnaComposerImpl as OrganizationDNA };
export { OrganizationDnaComposerImpl as OrganizationDnaComposer };
