import type { PlatformEvidenceRecord } from "@/lib/platform/evidence/types";

/** Merge KEE evidence records into rule evaluation facts. */
export function mergeEvidenceIntoFacts(
  facts: Record<string, unknown>,
  evidenceRecords: PlatformEvidenceRecord[]
): Record<string, unknown> {
  const merged = { ...facts };

  if (evidenceRecords.length === 0) {
    merged.evidence_count = 0;
    return merged;
  }

  merged.evidence_count = evidenceRecords.length;
  merged.evidence_confidence_avg =
    evidenceRecords.reduce((sum, record) => sum + record.evidence_confidence, 0) /
    evidenceRecords.length;
  merged.evidence_quality_avg =
    evidenceRecords.reduce((sum, record) => sum + record.evidence_quality, 0) /
    evidenceRecords.length;
  merged.competency_keys = [
    ...new Set(evidenceRecords.flatMap((record) => record.competency_keys)),
  ];
  merged.skill_keys = [...new Set(evidenceRecords.flatMap((record) => record.skill_keys))];

  return merged;
}

/** Map Decision Engine outcome into rule facts for chained evaluation. */
export function mergeDecisionOutcomeIntoFacts(
  facts: Record<string, unknown>,
  decisionOutcome: {
    outcomeKey: string;
    score?: number;
    confidence?: number;
  }
): Record<string, unknown> {
  return {
    ...facts,
    decision_outcome_key: decisionOutcome.outcomeKey,
    decision_outcome_score: decisionOutcome.score ?? null,
    decision_confidence: decisionOutcome.confidence ?? null,
  };
}
