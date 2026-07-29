/**
 * Recommendation origin audit — diagnostic only.
 */

import type { EducationConstitutionalTrace } from "../framework";
import type { EducationGraphRecommendation } from "../graph";
import type { EducationContributorResult } from "../framework";

export interface EducationRecommendationAuditEntry {
  recommendationId: string;
  kind: string;
  title: string;
  confidence: number;
  priority: number;
  /** Contributors that produced / own this recommendation. */
  originContributorIds: readonly string[];
  evidenceIds: readonly string[];
  constitutionalTrace: EducationConstitutionalTrace;
  /** Phase where the recommendation was observed. */
  source: "contributor" | "graph";
  conflictFlags?: readonly string[];
}

export interface EducationRecommendationAudit {
  entries: readonly EducationRecommendationAuditEntry[];
}

export function buildEducationRecommendationAudit(input: {
  contributorResults: ReadonlyArray<{
    contributorId: string;
    result: EducationContributorResult;
  }>;
  graphRecommendations: readonly EducationGraphRecommendation[];
}): EducationRecommendationAudit {
  const entries: EducationRecommendationAuditEntry[] = [];

  for (const { contributorId, result } of input.contributorResults) {
    for (const rec of result.recommendations) {
      entries.push({
        recommendationId: rec.id,
        kind: rec.kind,
        title: rec.title,
        confidence: rec.confidence,
        priority: rec.priority,
        originContributorIds: [contributorId],
        evidenceIds: [...rec.evidenceIds],
        constitutionalTrace: rec.constitutionalTrace,
        source: "contributor",
      });
    }
  }

  for (const rec of input.graphRecommendations) {
    entries.push({
      recommendationId: rec.id,
      kind: rec.kind,
      title: rec.title,
      confidence: rec.confidence,
      priority: rec.priority,
      originContributorIds: [...rec.originContributorIds],
      evidenceIds: [...rec.evidenceIds],
      constitutionalTrace: rec.constitutionalTrace,
      source: "graph",
      conflictFlags: [...rec.conflictFlags],
    });
  }

  return { entries };
}
