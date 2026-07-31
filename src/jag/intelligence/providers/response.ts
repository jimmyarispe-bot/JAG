/**
 * Provider response — structured EI artifacts only.
 * Raw model text may be retained for audit but never as evidence.
 */

import type { Assumption } from "@/jag/intelligence/contracts/assumption";
import type { Confidence } from "@/jag/intelligence/contracts/confidence";
import type { Explanation } from "@/jag/intelligence/contracts/explanation";
import type { Finding } from "@/jag/intelligence/contracts/finding";
import type { Recommendation } from "@/jag/intelligence/contracts/recommendation";
import type { DecisionTraceStep } from "@/jag/intelligence/contracts/decision-trace";

/**
 * Structured artifacts a provider must return so EI can attach them
 * to Findings, Recommendations, and Explanations.
 */
export type IntelligenceProviderArtifacts = {
  readonly findings: readonly Finding[];
  readonly recommendations: readonly Recommendation[];
  readonly explanation: Explanation;
  readonly assumptions?: readonly Assumption[];
  readonly confidence: Confidence;
  /** Optional decision-trace step updates for the reasoning stage. */
  readonly decisionTraceSteps?: readonly DecisionTraceStep[];
};

/**
 * Optional opaque provider diagnostics — never treated as Evidence.
 * Must not be mapped into organizational evidence kinds.
 */
export type ProviderDiagnostics = {
  readonly providerId: string;
  readonly notes?: string;
  /**
   * Raw completion text if the provider produced one.
   * Explicitly non-evidence — forbidden as EvidenceReference.kind.
   */
  readonly rawCompletion?: string;
};

export type IntelligenceProviderResponse = {
  readonly artifacts: IntelligenceProviderArtifacts;
  readonly diagnostics?: ProviderDiagnostics;
};

export function isIntelligenceProviderArtifacts(
  value: unknown
): value is IntelligenceProviderArtifacts {
  if (!value || typeof value !== "object") return false;
  const v = value as IntelligenceProviderArtifacts;
  return (
    Array.isArray(v.findings) &&
    Array.isArray(v.recommendations) &&
    v.explanation !== undefined &&
    v.confidence !== undefined
  );
}

export function isIntelligenceProviderResponse(
  value: unknown
): value is IntelligenceProviderResponse {
  if (!value || typeof value !== "object") return false;
  const v = value as IntelligenceProviderResponse;
  return isIntelligenceProviderArtifacts(v.artifacts);
}
