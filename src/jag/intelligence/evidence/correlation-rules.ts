/**
 * Deterministic correlation rules for the Evidence Graph.
 * Explainable and testable — no model inference.
 */

import type { OrganizationalEvidenceKind } from "@/jag/intelligence/evidence/reference-kinds";
import type {
  EvidenceCorrelationSink,
  EvidenceEdgeType,
} from "@/jag/intelligence/evidence/types";

export type EvidenceCorrelationRule = {
  readonly id: string;
  readonly fromKind: OrganizationalEvidenceKind;
  readonly toKind?: OrganizationalEvidenceKind;
  readonly toSink?: EvidenceCorrelationSink;
  readonly edgeType: EvidenceEdgeType;
  readonly explanation: string;
  /** Stable sort order when applying rules. */
  readonly order: number;
};

/**
 * Canonical chain:
 * Work → Decision → Policy → Report → Analytics → Recommendation
 */
export const EVIDENCE_CORRELATION_RULES: readonly EvidenceCorrelationRule[] =
  Object.freeze([
    Object.freeze({
      id: "work_to_decision",
      fromKind: "work",
      toKind: "decision",
      edgeType: "work_to_decision",
      explanation: "Work items implement or execute organizational decisions",
      order: 10,
    }),
    Object.freeze({
      id: "decision_to_policy",
      fromKind: "decision",
      toKind: "policy",
      edgeType: "decision_to_policy",
      explanation: "Decisions are governed by or enact policies",
      order: 20,
    }),
    Object.freeze({
      id: "policy_to_report",
      fromKind: "policy",
      toKind: "report",
      edgeType: "policy_to_report",
      explanation: "Policies are evidenced by compliance and status reports",
      order: 30,
    }),
    Object.freeze({
      id: "report_to_analytics",
      fromKind: "report",
      toKind: "analytics",
      edgeType: "report_to_analytics",
      explanation: "Reports are quantified by analytics definitions and metrics",
      order: 40,
    }),
    Object.freeze({
      id: "analytics_to_recommendation",
      fromKind: "analytics",
      toSink: "recommendation",
      edgeType: "analytics_to_recommendation",
      explanation:
        "Analytics inform recommendation-stage outputs (logical sink, not provider evidence)",
      order: 50,
    }),
  ]);

export function listCorrelationRules(): readonly EvidenceCorrelationRule[] {
  return EVIDENCE_CORRELATION_RULES;
}

export function findCorrelationRule(
  fromKind: OrganizationalEvidenceKind,
  toKind: OrganizationalEvidenceKind | undefined,
  toSink?: EvidenceCorrelationSink
): EvidenceCorrelationRule | undefined {
  return EVIDENCE_CORRELATION_RULES.find((rule) => {
    if (rule.fromKind !== fromKind) return false;
    if (toSink !== undefined) return rule.toSink === toSink;
    return rule.toKind === toKind;
  });
}
