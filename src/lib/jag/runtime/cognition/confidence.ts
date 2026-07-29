/** Confidence helpers — no ML, no LLM. */

export function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function averageConfidence(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + clampConfidence(b), 0);
  return clampConfidence(sum / values.length);
}

/**
 * Blend provider confidence with evidence strength.
 * More distinct evidence sources → slight boost (capped).
 */
export function scoreWithEvidence(
  baseConfidence: number,
  evidenceCount: number
): number {
  const base = clampConfidence(baseConfidence);
  if (evidenceCount <= 0) return clampConfidence(base * 0.5);
  const boost = Math.min(0.15, evidenceCount * 0.03);
  return clampConfidence(base + boost);
}

export function isHighConfidence(value: number): boolean {
  return clampConfidence(value) >= 0.85;
}

export function isLowConfidence(value: number): boolean {
  return clampConfidence(value) < 0.55;
}
