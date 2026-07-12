/**
 * Knowledge Quality Intelligence (Sprint 040 / 0.2.0).
 *
 * KnowledgeQualityEngine composes:
 * KnowledgeValidation, KnowledgeFreshness, KnowledgeCompleteness,
 * KnowledgeAccuracy, KnowledgeConsistency, KnowledgeConflictDetection,
 * KnowledgeRedundancyDetection, KnowledgeCoverageAnalysis,
 * KnowledgeLifecycleManagement.
 */

import type * as C from "@/lib/platform/intelligence/knowledge/contracts";
import {
  clamp,
  defaultCreateId,
  priorityFromRisk,
  statusFromScore,
} from "@/lib/platform/intelligence/knowledge/models";
import type * as T from "@/lib/platform/intelligence/knowledge/types";
import {
  KNOWLEDGE_ARTIFACT_STATUSES,
  KNOWLEDGE_QUALITY_DIMENSIONS,
  KNOWLEDGE_TYPES,
} from "@/lib/platform/intelligence/knowledge/types";

const DIMENSION_LABELS: Record<T.KnowledgeQualityDimension, string> = {
  validation: "Validation",
  freshness: "Freshness",
  completeness: "Completeness",
  accuracy: "Accuracy",
  consistency: "Consistency",
  conflict: "Conflict Detection",
  redundancy: "Redundancy Detection",
  coverage: "Coverage Analysis",
  lifecycle: "Lifecycle Management",
};

export class KnowledgeValidation implements C.KnowledgeValidation {
  assess(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    now: Date;
  }): T.KnowledgeValidationResult {
    void input.now;
    const validated = input.catalog.artifacts.filter((a) => a.validatedAt);
    const unvalidated = input.catalog.artifacts.length - validated.length;
    const ages = validated.map((a) =>
      daysBetween(a.validatedAt!, input.now.toISOString())
    );
    const averageAgeDays =
      ages.length > 0 ? ages.reduce((s, n) => s + n, 0) / ages.length : 0;
    const validatedRatio =
      validated.length / Math.max(1, input.catalog.artifacts.length);

    return {
      validatedCount: validated.length,
      unvalidatedCount: unvalidated,
      validatedRatio,
      averageAgeDays,
      narrative: `Validation ${Math.round(validatedRatio * 100)}% (${validated.length}/${input.catalog.artifacts.length}); avg age ${Math.round(averageAgeDays)}d. Baseline validated ratio ${(input.baseline.validatedRatio * 100).toFixed(0)}%.`,
    };
  }
}

export class KnowledgeFreshness implements C.KnowledgeFreshness {
  assess(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    now: Date;
  }): T.KnowledgeFreshnessResult {
    const ages = input.catalog.artifacts.map((a) =>
      daysBetween(a.provenance.lastModifiedDate, input.now.toISOString())
    );
    const staleThreshold = 60;
    const staleCount = ages.filter((d) => d >= staleThreshold).length;
    const staleRatio = staleCount / Math.max(1, ages.length);

    return {
      staleCount,
      staleRatio: clamp(Math.max(staleRatio, input.baseline.staleRatio)),
      freshestAgeDays: ages.length ? Math.min(...ages) : 0,
      oldestAgeDays: ages.length ? Math.max(...ages) : 0,
      narrative: `Freshness: ${staleCount} stale artifacts (ratio ${(staleRatio * 100).toFixed(0)}%); age range ${ages.length ? Math.min(...ages) : 0}–${ages.length ? Math.max(...ages) : 0}d.`,
    };
  }
}

export class KnowledgeCompleteness implements C.KnowledgeCompleteness {
  assess(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    now: Date;
  }): T.KnowledgeCompletenessResult {
    void input.now;
    const missingFields: string[] = [];
    const incompleteArtifactIds: string[] = [];

    for (const a of input.catalog.artifacts) {
      const p = a.provenance;
      if (!p.lastValidationDate) {
        missingFields.push(`${a.id}:lastValidationDate`);
        incompleteArtifactIds.push(a.id);
      }
      if (p.relatedPolicies.length === 0 && a.type === "procedures") {
        missingFields.push(`${a.id}:relatedPolicies`);
        incompleteArtifactIds.push(a.id);
      }
      if (p.versionHistory.length === 0) {
        missingFields.push(`${a.id}:versionHistory`);
        incompleteArtifactIds.push(a.id);
      }
    }

    const uniqueIncomplete = [...new Set(incompleteArtifactIds)];
    const completenessScore = clamp(
      100 -
        uniqueIncomplete.length * 6 -
        input.baseline.gapPressure * 20 +
        input.catalog.overallCoverage * 0.15
    );

    return {
      completenessScore,
      missingFields: [...new Set(missingFields)].slice(0, 20),
      incompleteArtifactIds: uniqueIncomplete,
      narrative: `Completeness ${Math.round(completenessScore)}; ${uniqueIncomplete.length} incomplete artifacts, ${missingFields.length} missing field signals.`,
    };
  }
}

export class KnowledgeAccuracy implements C.KnowledgeAccuracy {
  assess(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    now: Date;
  }): T.KnowledgeAccuracyResult {
    void input.now;
    const lowConfidenceCount = input.catalog.artifacts.filter(
      (a) => a.confidence < 55
    ).length;
    const avgConfidence =
      input.catalog.artifacts.reduce((s, a) => s + a.confidence, 0) /
      Math.max(1, input.catalog.artifacts.length);
    const accuracyScore = clamp(
      avgConfidence * 0.7 +
        input.baseline.validationScore * 0.2 +
        (100 - lowConfidenceCount * 5) * 0.1
    );

    return {
      accuracyScore,
      lowConfidenceCount,
      narrative: `Accuracy ${Math.round(accuracyScore)}; ${lowConfidenceCount} low-confidence artifacts.`,
    };
  }
}

export class KnowledgeConsistency implements C.KnowledgeConsistency {
  assess(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    graph: T.KnowledgeGraphResult;
    now: Date;
  }): T.KnowledgeConsistencyResult {
    void input.now;
    void input.catalog;
    const inconsistentPairs = input.graph.conflictCount;
    const consistencyScore = clamp(
      100 -
        inconsistentPairs * 12 -
        input.baseline.conflictPressure * 40 +
        input.graph.connectivityScore * 0.15
    );

    return {
      consistencyScore,
      inconsistentPairs,
      narrative: `Consistency ${Math.round(consistencyScore)}; ${inconsistentPairs} inconsistent pairs from graph conflicts.`,
    };
  }
}

export class KnowledgeConflictDetection
  implements C.KnowledgeConflictDetection
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  detect(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    graph: T.KnowledgeGraphResult;
    now: Date;
  }): T.KnowledgeConflictDetectionResult {
    void input.now;
    const conflictEdges = input.graph.edges.filter(
      (e) => e.kind === "conflicts_with"
    );
    const conflicts: T.KnowledgeConflictRecord[] = conflictEdges.map((e) => ({
      id: this.createId("know-conflict"),
      leftArtifactId: e.fromId,
      rightArtifactId: e.toId,
      severity: priorityFromRisk(input.baseline.conflictPressure),
      narrative: e.narrative,
    }));

    if (conflicts.length === 0 && input.baseline.conflictPressure > 0.25) {
      const [left, right] = input.catalog.artifacts;
      if (left && right) {
        conflicts.push({
          id: this.createId("know-conflict"),
          leftArtifactId: left.id,
          rightArtifactId: right.id,
          severity: priorityFromRisk(input.baseline.conflictPressure),
          narrative: `Latent conflict pressure ${(input.baseline.conflictPressure * 100).toFixed(0)}% between ${left.title} and ${right.title}.`,
        });
      }
    }

    const conflictPressure = clamp(
      Math.max(
        input.baseline.conflictPressure * 100,
        conflicts.length * 18
      )
    );
    const hottestSeverity =
      conflicts.sort((a, c) => severityRank(c.severity) - severityRank(a.severity))[0]
        ?.severity ?? "monitor";

    return {
      conflicts,
      conflictPressure,
      hottestSeverity,
      narrative: `Conflict detection found ${conflicts.length} conflicts; pressure ${Math.round(conflictPressure)}.`,
    };
  }
}

export class KnowledgeRedundancyDetection
  implements C.KnowledgeRedundancyDetection
{
  detect(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    search: T.KnowledgeSearchResult;
    now: Date;
  }): T.KnowledgeRedundancyDetectionResult {
    void input.now;
    const redundantClusters = Math.max(
      input.search.duplicateClusters,
      Math.round(input.baseline.duplicatePressure * 8)
    );
    const redundantArtifactIds = input.catalog.artifacts
      .filter((a) => a.confidence < 65 && a.dependents < 3)
      .slice(0, redundantClusters)
      .map((a) => a.id);
    const redundancyPressure = clamp(
      Math.max(
        input.baseline.duplicatePressure * 100,
        redundantClusters * 12
      )
    );

    return {
      redundantClusters,
      redundantArtifactIds,
      redundancyPressure,
      narrative: `Redundancy detection: ${redundantClusters} clusters, pressure ${Math.round(redundancyPressure)}.`,
    };
  }
}

export class KnowledgeCoverageAnalysis implements C.KnowledgeCoverageAnalysis {
  analyze(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    now: Date;
  }): T.KnowledgeCoverageAnalysisResult {
    void input.now;
    const byType = { ...input.catalog.byType } as Record<
      T.KnowledgeType,
      number
    >;
    for (const type of KNOWLEDGE_TYPES) {
      if (byType[type] === undefined) byType[type] = 0;
    }
    return {
      coverageScore: clamp(input.catalog.overallCoverage),
      byType,
      weakestType: input.catalog.weakestType,
      narrative: `Coverage analysis ${Math.round(input.catalog.overallCoverage)}; weakest ${input.catalog.weakestType}. Baseline coverage ${Math.round(input.baseline.coverageScore)}.`,
    };
  }
}

export class KnowledgeLifecycleManagement
  implements C.KnowledgeLifecycleManagement
{
  manage(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    now: Date;
  }): T.KnowledgeLifecycleManagementResult {
    void input.now;
    const byStatus = Object.fromEntries(
      KNOWLEDGE_ARTIFACT_STATUSES.map((s) => [s, 0])
    ) as Record<T.KnowledgeArtifactStatus, number>;

    const recommendedTransitions: T.KnowledgeLifecycleManagementResult["recommendedTransitions"] =
      [];

    for (const a of input.catalog.artifacts) {
      const status = lifecycleStatus(a);
      byStatus[status] += 1;
      if (status === "generated" && a.confidence >= 75 && a.validatedAt) {
        recommendedTransitions.push({
          artifactId: a.id,
          fromStatus: "generated",
          toStatus: "reviewed",
          rationale: "Validated high-confidence artifact ready for review.",
        });
      } else if (
        status === "reviewed" &&
        daysBetween(a.provenance.lastModifiedDate, input.now.toISOString()) > 90
      ) {
        recommendedTransitions.push({
          artifactId: a.id,
          fromStatus: "reviewed",
          toStatus: "archived",
          rationale: "Stale reviewed artifact should be archived or refreshed.",
        });
      } else if (
        a.provenance.approvalStatus === "expired" ||
        a.confidence < 40
      ) {
        recommendedTransitions.push({
          artifactId: a.id,
          fromStatus: status,
          toStatus: "superseded",
          rationale: "Low-trust artifact should be superseded.",
        });
      }
    }

    const active =
      byStatus.generated + byStatus.reviewed + byStatus.distributed;
    const activeRatio = active / Math.max(1, input.catalog.artifacts.length);

    return {
      byStatus,
      activeRatio,
      supersededCount: byStatus.superseded,
      archivedCount: byStatus.archived,
      recommendedTransitions: recommendedTransitions.slice(0, 12),
      narrative: `Lifecycle: active ${(activeRatio * 100).toFixed(0)}%, superseded ${byStatus.superseded}, archived ${byStatus.archived}; ${recommendedTransitions.length} transitions recommended. Stale ratio ${(input.baseline.staleRatio * 100).toFixed(0)}%.`,
    };
  }
}

/**
 * KnowledgeQualityEngine — composes all quality sub-analyzers.
 */
export class KnowledgeQualityEngine implements C.KnowledgeQualityEngine {
  private readonly validation: C.KnowledgeValidation;
  private readonly freshness: C.KnowledgeFreshness;
  private readonly completeness: C.KnowledgeCompleteness;
  private readonly accuracy: C.KnowledgeAccuracy;
  private readonly consistency: C.KnowledgeConsistency;
  private readonly conflictDetection: C.KnowledgeConflictDetection;
  private readonly redundancyDetection: C.KnowledgeRedundancyDetection;
  private readonly coverageAnalysis: C.KnowledgeCoverageAnalysis;
  private readonly lifecycleManagement: C.KnowledgeLifecycleManagement;

  constructor(
    deps: {
      validation?: C.KnowledgeValidation;
      freshness?: C.KnowledgeFreshness;
      completeness?: C.KnowledgeCompleteness;
      accuracy?: C.KnowledgeAccuracy;
      consistency?: C.KnowledgeConsistency;
      conflictDetection?: C.KnowledgeConflictDetection;
      redundancyDetection?: C.KnowledgeRedundancyDetection;
      coverageAnalysis?: C.KnowledgeCoverageAnalysis;
      lifecycleManagement?: C.KnowledgeLifecycleManagement;
      createId?: (prefix: string) => string;
    } = {}
  ) {
    const createId = deps.createId ?? defaultCreateId;
    this.validation = deps.validation ?? new KnowledgeValidation();
    this.freshness = deps.freshness ?? new KnowledgeFreshness();
    this.completeness = deps.completeness ?? new KnowledgeCompleteness();
    this.accuracy = deps.accuracy ?? new KnowledgeAccuracy();
    this.consistency = deps.consistency ?? new KnowledgeConsistency();
    this.conflictDetection =
      deps.conflictDetection ?? new KnowledgeConflictDetection(createId);
    this.redundancyDetection =
      deps.redundancyDetection ?? new KnowledgeRedundancyDetection();
    this.coverageAnalysis =
      deps.coverageAnalysis ?? new KnowledgeCoverageAnalysis();
    this.lifecycleManagement =
      deps.lifecycleManagement ?? new KnowledgeLifecycleManagement();
  }

  assess(input: {
    baseline: T.KnowledgeBaseline;
    catalog: T.KnowledgeCatalogResult;
    graph: T.KnowledgeGraphResult;
    search: T.KnowledgeSearchResult;
    now: Date;
  }): T.KnowledgeQualitySuite {
    const validation = this.validation.assess(input);
    const freshness = this.freshness.assess(input);
    const completeness = this.completeness.assess(input);
    const accuracy = this.accuracy.assess(input);
    const consistency = this.consistency.assess(input);
    const conflictDetection = this.conflictDetection.detect(input);
    const redundancyDetection = this.redundancyDetection.detect(input);
    const coverageAnalysis = this.coverageAnalysis.analyze(input);
    const lifecycleManagement = this.lifecycleManagement.manage(input);

    const scoreByDimension: Record<T.KnowledgeQualityDimension, number> = {
      validation: clamp(validation.validatedRatio * 100),
      freshness: clamp(100 - freshness.staleRatio * 100),
      completeness: completeness.completenessScore,
      accuracy: accuracy.accuracyScore,
      consistency: consistency.consistencyScore,
      conflict: clamp(100 - conflictDetection.conflictPressure),
      redundancy: clamp(100 - redundancyDetection.redundancyPressure),
      coverage: coverageAnalysis.coverageScore,
      lifecycle: clamp(lifecycleManagement.activeRatio * 100),
    };

    const dimensions: T.KnowledgeQualityDimensionRecord[] =
      KNOWLEDGE_QUALITY_DIMENSIONS.map((dimension) => {
        const score = scoreByDimension[dimension];
        return {
          dimension,
          label: DIMENSION_LABELS[dimension],
          score,
          status: statusFromScore(score),
          narrative: `${DIMENSION_LABELS[dimension]} ${statusFromScore(score)} at ${Math.round(score)}.`,
        };
      });

    const overallScore = clamp(
      dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length
    );
    const status = statusFromScore(overallScore);

    return {
      overallScore,
      status,
      dimensions,
      validation,
      freshness,
      completeness,
      accuracy,
      consistency,
      conflictDetection,
      redundancyDetection,
      coverageAnalysis,
      lifecycleManagement,
      narrative: `Knowledge quality ${status} (${Math.round(overallScore)}) across ${dimensions.length} dimensions.`,
    };
  }
}

function daysBetween(isoA: string, isoB: string): number {
  const a = Date.parse(isoA);
  const b = Date.parse(isoB);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round(Math.abs(b - a) / 86_400_000));
}

function lifecycleStatus(
  artifact: T.KnowledgeArtifactRecord
): T.KnowledgeArtifactStatus {
  if (artifact.provenance.approvalStatus === "superseded") return "superseded";
  if (artifact.provenance.approvalStatus === "expired") return "archived";
  if (artifact.confidence >= 75 && artifact.validatedAt) return "reviewed";
  if (artifact.confidence >= 55) return "generated";
  return "draft";
}

function severityRank(band: T.KnowledgePriorityBand): number {
  switch (band) {
    case "critical":
      return 5;
    case "high":
      return 4;
    case "medium":
      return 3;
    case "low":
      return 2;
    case "monitor":
      return 1;
  }
}
