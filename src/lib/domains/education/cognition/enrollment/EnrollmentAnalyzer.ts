/**
 * Enrollment Analyzer — pure readiness reasoning over normalized contracts.
 * No database access. No Action execution.
 */

import {
  collectEnrollmentEvidence,
  toEvidenceSet,
  type EnrollmentEvidenceItem,
} from "./EnrollmentEvidence";
import {
  buildEnrollmentRecommendations,
  flattenSuggestedActions,
} from "./EnrollmentRecommendations";
import type {
  EnrollmentIntelligenceResult,
  EnrollmentObservation,
} from "./EnrollmentTypes";

export interface EnrollmentReadinessBreakdown {
  blockingIssues: string[];
  warnings: string[];
  readiness: "ready" | "blocked" | "conditional";
  confidence: number;
  explanation: string;
  priority: number;
}

/** Score readiness from evidence severities. */
export function scoreEnrollmentReadiness(
  evidence: readonly EnrollmentEvidenceItem[]
): EnrollmentReadinessBreakdown {
  const blockingIssues = evidence
    .filter((e) => e.severity === "blocking")
    .map((e) => e.summary);
  const warnings = evidence
    .filter((e) => e.severity === "warning")
    .map((e) => e.summary);

  let confidence = 1;
  confidence -= blockingIssues.length * 0.18;
  confidence -= warnings.length * 0.06;
  confidence = clamp01(confidence);

  let readiness: EnrollmentReadinessBreakdown["readiness"];
  if (blockingIssues.length > 0) {
    readiness = "blocked";
  } else if (warnings.length > 0) {
    readiness = "conditional";
    confidence = Math.min(confidence, 0.82);
  } else {
    readiness = "ready";
    confidence = Math.max(confidence, 0.88);
  }

  const priority =
    blockingIssues.length > 0 ? 1 : warnings.length > 0 ? 2 : 3;

  const explanation =
    readiness === "ready"
      ? "Enrollment observation satisfies readiness criteria with supporting evidence."
      : readiness === "conditional"
        ? `Enrollment is conditionally ready with warnings: ${warnings.join("; ")}`
        : `Enrollment is blocked: ${blockingIssues.join("; ")}`;

  return {
    blockingIssues,
    warnings,
    readiness,
    confidence,
    explanation,
    priority,
  };
}

/**
 * Analyze a normalized enrollment observation.
 * Returns evidence, recommendations, confidence, and action proposals only.
 */
export function analyzeEnrollment(
  observation: EnrollmentObservation,
  options: { now?: string } = {}
): EnrollmentIntelligenceResult {
  assertObservation(observation);

  const evidenceItems = collectEnrollmentEvidence(observation);
  const readiness = scoreEnrollmentReadiness(evidenceItems);
  const recommendations = buildEnrollmentRecommendations({
    observation,
    evidence: evidenceItems,
    blockingIssues: readiness.blockingIssues,
    warnings: readiness.warnings,
    readiness: readiness.readiness,
    confidence: readiness.confidence,
  });
  const suggestedActions = flattenSuggestedActions(recommendations);

  return {
    enrollmentRequestId: observation.enrollmentRequestId,
    evidence: toEvidenceSet(evidenceItems),
    recommendations,
    confidence: readiness.confidence,
    explanation: readiness.explanation,
    priority: readiness.priority,
    blockingIssues: readiness.blockingIssues,
    warnings: readiness.warnings,
    suggestedActions,
    readiness: readiness.readiness,
    analyzedAt: options.now ?? new Date().toISOString(),
  };
}

function assertObservation(observation: EnrollmentObservation): void {
  if (!observation?.enrollmentRequestId?.trim()) {
    throw new Error("EnrollmentObservation.enrollmentRequestId is required");
  }
  if (!observation.organizationId?.trim()) {
    throw new Error("EnrollmentObservation.organizationId is required");
  }
  if (!observation.student?.studentId?.trim()) {
    throw new Error("EnrollmentObservation.student.studentId is required");
  }
  if (!observation.program?.programId?.trim()) {
    throw new Error("EnrollmentObservation.program.programId is required");
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number(n.toFixed(4))));
}
