/**
 * Autonomous Executive Operating Loop — decision.
 *
 * Determines automatic / approval_required / ceo_approval / board_approval.
 */

import { AutonomyGovernance } from "@/lib/platform/autonomy/governance";
import type {
  AutonomyApprovalMode,
  AutonomyDecisionResult,
  AutonomyDiagnosisResult,
  AutonomyEscalationSeverity,
  AutonomyGovernanceDecision,
  AutonomyLoopRequest,
  AutonomyPlan,
} from "@/lib/platform/autonomy/types";
import type { IntelligenceConfidenceScore } from "@/lib/platform/intelligence/types";

export interface AutonomyDecisionDependencies {
  governance?: AutonomyGovernance;
  createId?: (prefix: string) => string;
}

function confidence(value: number): IntelligenceConfidenceScore {
  const level =
    value >= 0.8 ? "high" : value >= 0.55 ? "medium" : ("low" as const);
  return { value, level, factors: [] };
}

function rankSeverity(severity: AutonomyEscalationSeverity): number {
  return { low: 1, medium: 2, high: 3, critical: 4 }[severity];
}

/**
 * DECIDE — choose approval mode for the planned action.
 */
export class AutonomyDecision {
  private readonly governance: AutonomyGovernance;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: AutonomyDecisionDependencies = {}) {
    this.governance = dependencies.governance ?? new AutonomyGovernance();
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  decide(
    request: AutonomyLoopRequest,
    diagnosis: AutonomyDiagnosisResult,
    plan: AutonomyPlan,
    governanceChecks: AutonomyGovernanceDecision[]
  ): AutonomyDecisionResult {
    const primary =
      diagnosis.causes.find((c) => c.causeId === diagnosis.primaryCauseId) ??
      diagnosis.causes[0]!;

    const confValue = Math.min(
      plan.confidence.value,
      diagnosis.confidence.value,
      request.decision?.recommendation.confidence.value ?? 1
    );

    let approvalMode: AutonomyApprovalMode = "automatic";
    const rationale: string[] = [];

    if (primary.severity === "critical" || primary.kind === "compliance_risk") {
      approvalMode = "board_approval";
      rationale.push(
        `Severity ${primary.severity} / kind ${primary.kind} requires board approval`
      );
    } else if (primary.severity === "high" || confValue < 0.55) {
      approvalMode = "ceo_approval";
      rationale.push(
        primary.severity === "high"
          ? "High severity requires CEO approval"
          : `Confidence ${confValue} below automatic threshold`
      );
    } else if (rankSeverity(primary.severity) >= 2 && confValue < 0.65) {
      approvalMode = "approval_required";
      rationale.push("Medium severity with moderate confidence requires operator approval");
    } else {
      rationale.push("Severity and confidence within automatic execution band");
    }

    const autoGate = this.governance.evaluate("decide_automatic", {
      severity: primary.severity,
      confidence: confValue,
      policies: request.policies,
    });
    governanceChecks.push(autoGate);

    if (approvalMode === "automatic" && !autoGate.allowed) {
      approvalMode = "approval_required";
      rationale.push(`Governance blocked automatic decision: ${autoGate.reason}`);
    }

    const approvedForExecution = approvalMode === "automatic";
    const requiresHuman = !approvedForExecution;

    return {
      decisionId: this.createId("decision"),
      requestId: request.requestId,
      approvalMode,
      approvedForExecution,
      rationale,
      recommendedPlanId: plan.planId,
      confidence: confidence(confValue),
      requiresHuman,
    };
  }
}
