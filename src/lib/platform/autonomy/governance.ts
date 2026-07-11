/**
 * Autonomous Executive Operating Loop — governance.
 *
 * Policy-based execution permissions for autonomous actions.
 */

import type {
  AutonomyEscalationSeverity,
  AutonomyGovernanceAction,
  AutonomyGovernanceDecision,
  AutonomyGovernancePolicy,
} from "@/lib/platform/autonomy/types";

const SEVERITY_RANK: Record<AutonomyEscalationSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/** Default permissive policies for local/test runs. */
export const DEFAULT_AUTONOMY_POLICIES: readonly AutonomyGovernancePolicy[] = [
  {
    policyId: "default-observe",
    action: "observe",
    allowed: true,
    reason: "Observation is always permitted",
  },
  {
    policyId: "default-diagnose",
    action: "diagnose",
    allowed: true,
    reason: "Diagnosis is always permitted",
  },
  {
    policyId: "default-plan",
    action: "plan",
    allowed: true,
    reason: "Planning is always permitted",
  },
  {
    policyId: "default-decide-auto",
    action: "decide_automatic",
    allowed: true,
    maxSeverity: "medium",
    minConfidence: 0.55,
    reason: "Automatic decisions limited to medium severity with confidence ≥ 0.55",
  },
  {
    policyId: "default-execute-auto",
    action: "execute_automatic",
    allowed: true,
    maxSeverity: "medium",
    minConfidence: 0.6,
    reason: "Automatic execution limited to medium severity with confidence ≥ 0.6",
  },
  {
    policyId: "default-execute-approval",
    action: "execute_with_approval",
    allowed: true,
    reason: "Execution with human approval is permitted",
  },
  {
    policyId: "default-escalate-ceo",
    action: "escalate_ceo",
    allowed: true,
    reason: "CEO escalation is permitted",
  },
  {
    policyId: "default-escalate-board",
    action: "escalate_board",
    allowed: true,
    reason: "Board escalation is permitted",
  },
  {
    policyId: "default-write-memory",
    action: "write_memory",
    allowed: true,
    reason: "Persistent memory writes are permitted",
  },
  {
    policyId: "default-measure",
    action: "measure",
    allowed: true,
    reason: "Measurement is always permitted",
  },
];

export interface AutonomyGovernanceDependencies {
  policies?: readonly AutonomyGovernancePolicy[];
}

/**
 * Evaluates whether an autonomous action is permitted under policy.
 */
export class AutonomyGovernance {
  private readonly policies: readonly AutonomyGovernancePolicy[];

  constructor(dependencies: AutonomyGovernanceDependencies = {}) {
    this.policies = dependencies.policies ?? DEFAULT_AUTONOMY_POLICIES;
  }

  listPolicies(): readonly AutonomyGovernancePolicy[] {
    return this.policies;
  }

  evaluate(
    action: AutonomyGovernanceAction,
    context: {
      severity?: AutonomyEscalationSeverity;
      confidence?: number;
      policies?: readonly AutonomyGovernancePolicy[];
    } = {}
  ): AutonomyGovernanceDecision {
    const policies = context.policies ?? this.policies;
    const matches = policies.filter((p) => p.action === action);

    if (matches.length === 0) {
      return {
        action,
        allowed: false,
        matchedPolicyId: null,
        reason: `No governance policy registered for action "${action}"`,
      };
    }

    // Last matching policy wins (allows request overrides to append).
    const policy = matches[matches.length - 1]!;

    if (!policy.allowed) {
      return {
        action,
        allowed: false,
        matchedPolicyId: policy.policyId,
        reason: policy.reason,
      };
    }

    if (
      policy.maxSeverity &&
      context.severity &&
      SEVERITY_RANK[context.severity] > SEVERITY_RANK[policy.maxSeverity]
    ) {
      return {
        action,
        allowed: false,
        matchedPolicyId: policy.policyId,
        reason: `Severity ${context.severity} exceeds policy max ${policy.maxSeverity}`,
      };
    }

    if (
      typeof policy.minConfidence === "number" &&
      typeof context.confidence === "number" &&
      context.confidence < policy.minConfidence
    ) {
      return {
        action,
        allowed: false,
        matchedPolicyId: policy.policyId,
        reason: `Confidence ${context.confidence} below policy minimum ${policy.minConfidence}`,
      };
    }

    return {
      action,
      allowed: true,
      matchedPolicyId: policy.policyId,
      reason: policy.reason,
    };
  }
}
