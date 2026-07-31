/**
 * Finding — intermediate conclusion grounded in evidence.
 */

import type { Confidence } from "@/jag/intelligence/contracts/confidence";
import { isConfidence } from "@/jag/intelligence/contracts/confidence";

export type FindingSeverity = "info" | "watch" | "concern" | "critical";

export type Finding = {
  readonly id: string;
  readonly statement: string;
  readonly evidenceIds: readonly string[];
  readonly confidence: Confidence;
  readonly severity?: FindingSeverity;
  readonly relatedCapabilityIds?: readonly string[];
};

export function isFinding(value: unknown): value is Finding {
  if (!value || typeof value !== "object") return false;
  const v = value as Finding;
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    typeof v.statement === "string" &&
    v.statement.length > 0 &&
    Array.isArray(v.evidenceIds) &&
    v.evidenceIds.length > 0 &&
    isConfidence(v.confidence)
  );
}
