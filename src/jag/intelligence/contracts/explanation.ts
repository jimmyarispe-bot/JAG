/**
 * Explanation — human-readable account of how findings were reached.
 */

export type Explanation = {
  readonly id: string;
  readonly narrative: string;
  readonly findingIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly assumptionIds?: readonly string[];
  /** Explicit “because” clauses tied to evidence. */
  readonly because?: readonly {
    readonly claim: string;
    readonly evidenceIds: readonly string[];
  }[];
};

export function isExplanation(value: unknown): value is Explanation {
  if (!value || typeof value !== "object") return false;
  const v = value as Explanation;
  return (
    typeof v.id === "string" &&
    typeof v.narrative === "string" &&
    v.narrative.length > 0 &&
    Array.isArray(v.findingIds) &&
    Array.isArray(v.evidenceIds)
  );
}
