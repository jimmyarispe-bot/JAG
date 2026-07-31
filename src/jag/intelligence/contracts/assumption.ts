/**
 * Assumption — explicit premise used during reasoning.
 */

export type AssumptionStatus = "stated" | "inferred" | "unverified";

export type Assumption = {
  readonly id: string;
  readonly statement: string;
  readonly status: AssumptionStatus;
  /** Evidence ids that support or challenge the assumption. */
  readonly relatedEvidenceIds?: readonly string[];
};

export function isAssumption(value: unknown): value is Assumption {
  if (!value || typeof value !== "object") return false;
  const v = value as Assumption;
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    typeof v.statement === "string" &&
    v.statement.length > 0 &&
    ["stated", "inferred", "unverified"].includes(v.status)
  );
}
