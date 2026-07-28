/**
 * Configurable quality score weights — must sum to 100.
 */

export type QualityWeightKey =
  | "testHealth"
  | "architectureHealth"
  | "documentationCoverage"
  | "performanceBaselines"
  | "securityFindings"
  | "technicalDebt"
  | "accessibility"
  | "releaseReadiness";

export type QualityWeights = Readonly<Record<QualityWeightKey, number>>;

export const DEFAULT_QUALITY_WEIGHTS: QualityWeights = Object.freeze({
  testHealth: 20,
  architectureHealth: 15,
  documentationCoverage: 12,
  performanceBaselines: 10,
  securityFindings: 15,
  technicalDebt: 10,
  accessibility: 8,
  releaseReadiness: 10,
});

const g = globalThis as typeof globalThis & {
  __jagStudioQualityWeights?: QualityWeights;
};

export function getQualityWeights(): QualityWeights {
  return g.__jagStudioQualityWeights ?? DEFAULT_QUALITY_WEIGHTS;
}

export function setQualityWeights(
  weights: QualityWeights
): QualityWeights | { error: string } {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 100) > 0.01) {
    return { error: `Quality weights must sum to 100 (got ${sum}).` };
  }
  g.__jagStudioQualityWeights = Object.freeze({ ...weights });
  return g.__jagStudioQualityWeights;
}

export function resetQualityWeightsForTests(): void {
  g.__jagStudioQualityWeights = undefined;
}
