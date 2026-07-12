/**
 * Knowledge Evolution (Sprint 040 / 0.2.0).
 *
 * Continuously detect stale/conflicting knowledge, recommend updates,
 * identify missing knowledge, suggest documentation improvements,
 * surface organizational expertise, and preserve institutional memory
 * across leadership transitions.
 */

import type { KnowledgeEvolutionEngine as KnowledgeEvolutionEngineContract } from "@/lib/platform/intelligence/knowledge/contracts";
import {
  clamp,
  defaultCreateId,
  priorityFromRisk,
  priorityFromScore,
} from "@/lib/platform/intelligence/knowledge/models";
import type {
  ExpertiseMapResult,
  KnowledgeBaseline,
  KnowledgeCatalogResult,
  KnowledgeEvolutionAction,
  KnowledgeEvolutionActionRecord,
  KnowledgeEvolutionResult,
  KnowledgeGapResult,
  KnowledgeQualitySuite,
  KnowledgeReasoningResult,
  OrganizationalMemorySuite,
} from "@/lib/platform/intelligence/knowledge/types";
import { KNOWLEDGE_EVOLUTION_ACTIONS } from "@/lib/platform/intelligence/knowledge/types";

const ACTION_LABELS: Record<KnowledgeEvolutionAction, string> = {
  detect_stale: "Detect Stale Knowledge",
  detect_conflict: "Detect Conflicting Knowledge",
  recommend_update: "Recommend Updates",
  identify_missing: "Identify Missing Knowledge",
  suggest_documentation: "Suggest Documentation Improvements",
  surface_expertise: "Surface Organizational Expertise",
  preserve_across_transition: "Preserve Memory Across Leadership Transitions",
};

export class KnowledgeEvolutionEngine
  implements KnowledgeEvolutionEngineContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  evolve(input: {
    baseline: KnowledgeBaseline;
    catalog: KnowledgeCatalogResult;
    quality: KnowledgeQualitySuite;
    gaps: KnowledgeGapResult;
    reasoning: KnowledgeReasoningResult;
    expertiseMap: ExpertiseMapResult;
    organizationalMemory: OrganizationalMemorySuite;
    now: Date;
  }): KnowledgeEvolutionResult {
    void input.now;

    const staleIds = input.catalog.artifacts
      .filter(
        (a) =>
          !a.validatedAt ||
          a.provenance.approvalStatus === "expired" ||
          a.confidence < 50
      )
      .map((a) => a.id);
    const conflictIds = input.quality.conflictDetection.conflicts.flatMap(
      (c) => [c.leftArtifactId, c.rightArtifactId]
    );
    const missingTopics =
      input.reasoning.missingTopics.length > 0
        ? input.reasoning.missingTopics
        : input.gaps.gaps.map((g) => g.label);

    const updateRecommendations = [
      `Refresh ${input.catalog.weakestType} corpus with current owners and validation dates.`,
      `Reconcile ${input.quality.conflictDetection.conflicts.length} conflicting artifacts.`,
      `Close hottest gap: ${input.gaps.hottestGap}.`,
    ];

    const documentationSuggestions = [
      `Document ownership and provenance for ${input.catalog.weakestType}.`,
      `Add SOPs/playbooks where procedure coverage is weak.`,
      `Capture meeting summaries for decisions without institutional memory links.`,
    ];

    const expertiseSurfaced = input.expertiseMap.domains
      .filter((d) => d.coverage >= 55)
      .flatMap((d) => d.experts.slice(0, 2))
      .slice(0, 8);

    const transitionPreservationScore = clamp(
      input.organizationalMemory.leadershipTransitionReadiness
    );

    const actions: KnowledgeEvolutionActionRecord[] =
      KNOWLEDGE_EVOLUTION_ACTIONS.map((action) =>
        buildAction(action, {
          createId: this.createId,
          baseline: input.baseline,
          catalog: input.catalog,
          quality: input.quality,
          gaps: input.gaps,
          missingTopics,
          staleIds,
          conflictIds,
          expertiseSurfaced,
          transitionPreservationScore,
          updateRecommendations,
          documentationSuggestions,
        })
      );

    const staleDetected = staleIds.length;
    const conflictsDetected = input.quality.conflictDetection.conflicts.length;
    const overallEvolutionPressure = clamp(
      staleDetected * 6 +
        conflictsDetected * 10 +
        input.gaps.overallGapPressure * 0.35 +
        input.baseline.staleRatio * 40
    );

    return {
      actions,
      staleDetected,
      conflictsDetected,
      missingTopics,
      updateRecommendations,
      documentationSuggestions,
      expertiseSurfaced,
      transitionPreservationScore,
      overallEvolutionPressure,
      narrative: `Knowledge evolution pressure ${Math.round(overallEvolutionPressure)} — stale ${staleDetected}, conflicts ${conflictsDetected}, missing topics ${missingTopics.length}; transition preservation ${Math.round(transitionPreservationScore)}.`,
    };
  }
}

function buildAction(
  action: KnowledgeEvolutionAction,
  ctx: {
    createId: (prefix: string) => string;
    baseline: KnowledgeBaseline;
    catalog: KnowledgeCatalogResult;
    quality: KnowledgeQualitySuite;
    gaps: KnowledgeGapResult;
    missingTopics: string[];
    staleIds: string[];
    conflictIds: string[];
    expertiseSurfaced: string[];
    transitionPreservationScore: number;
    updateRecommendations: string[];
    documentationSuggestions: string[];
  }
): KnowledgeEvolutionActionRecord {
  switch (action) {
    case "detect_stale":
      return {
        id: ctx.createId("know-evo"),
        action,
        label: ACTION_LABELS[action],
        priority: priorityFromRisk(ctx.baseline.staleRatio),
        score: clamp(ctx.staleIds.length * 8 + ctx.baseline.staleRatio * 100),
        artifactIds: ctx.staleIds.slice(0, 8),
        recommendation: "Schedule validation cadence for stale artifacts.",
        narrative: `Detected ${ctx.staleIds.length} stale knowledge artifacts.`,
      };
    case "detect_conflict":
      return {
        id: ctx.createId("know-evo"),
        action,
        label: ACTION_LABELS[action],
        priority: priorityFromRisk(ctx.baseline.conflictPressure),
        score: clamp(ctx.quality.conflictDetection.conflictPressure),
        artifactIds: [...new Set(ctx.conflictIds)].slice(0, 8),
        recommendation: "Reconcile conflicts and supersede outdated versions.",
        narrative: `Detected ${ctx.quality.conflictDetection.conflicts.length} conflicting knowledge pairs.`,
      };
    case "recommend_update":
      return {
        id: ctx.createId("know-evo"),
        action,
        label: ACTION_LABELS[action],
        priority: priorityFromScore(100 - ctx.catalog.overallCoverage),
        score: clamp(100 - ctx.catalog.overallCoverage + 40),
        artifactIds: ctx.catalog.artifacts
          .filter((a) => a.type === ctx.catalog.weakestType)
          .map((a) => a.id),
        recommendation: ctx.updateRecommendations[0]!,
        narrative: ctx.updateRecommendations.join(" "),
      };
    case "identify_missing":
      return {
        id: ctx.createId("know-evo"),
        action,
        label: ACTION_LABELS[action],
        priority: priorityFromRisk(ctx.gaps.overallGapPressure / 100),
        score: clamp(ctx.gaps.overallGapPressure),
        artifactIds: [],
        recommendation: `Prioritize missing topics: ${ctx.missingTopics.slice(0, 3).join(", ")}.`,
        narrative: `Identified ${ctx.missingTopics.length} missing knowledge topics; hottest gap ${ctx.gaps.hottestGap}.`,
      };
    case "suggest_documentation":
      return {
        id: ctx.createId("know-evo"),
        action,
        label: ACTION_LABELS[action],
        priority: "medium",
        score: clamp(55 + ctx.baseline.gapPressure * 30),
        artifactIds: [],
        recommendation: ctx.documentationSuggestions[0]!,
        narrative: ctx.documentationSuggestions.join(" "),
      };
    case "surface_expertise":
      return {
        id: ctx.createId("know-evo"),
        action,
        label: ACTION_LABELS[action],
        priority: priorityFromScore(ctx.baseline.expertCoverage),
        score: clamp(100 - ctx.baseline.expertCoverage + 45),
        artifactIds: [],
        recommendation: `Engage experts: ${ctx.expertiseSurfaced.slice(0, 3).join(", ") || "map domain experts"}.`,
        narrative: `Surfaced ${ctx.expertiseSurfaced.length} organizational experts for knowledge stewardship.`,
      };
    case "preserve_across_transition":
      return {
        id: ctx.createId("know-evo"),
        action,
        label: ACTION_LABELS[action],
        priority: priorityFromScore(ctx.transitionPreservationScore),
        score: clamp(100 - ctx.transitionPreservationScore + 40),
        artifactIds: ctx.catalog.artifacts
          .filter((a) => a.type === "institutional_memory" || a.type === "decisions")
          .map((a) => a.id),
        recommendation:
          "Capture critical decisions, policies, and expertise before leadership transitions.",
        narrative: `Leadership transition preservation readiness ${Math.round(ctx.transitionPreservationScore)}.`,
      };
  }
}
