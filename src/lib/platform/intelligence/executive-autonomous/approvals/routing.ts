/**
 * Policy-driven approval routing (Sprint 066).
 */

import { DEFAULT_AUTONOMOUS_POLICIES } from "@/lib/platform/intelligence/executive-autonomous/approvals/policies";
import type {
  ApprovalRole,
  ApprovalStep,
  OrganizationalPolicy,
  WorkflowKind,
} from "@/lib/platform/intelligence/executive-autonomous/types";

export function routeApprovals(input: {
  workflowKind: WorkflowKind;
  policies?: OrganizationalPolicy[];
  createId: (prefix: string) => string;
  financialImpact?: number;
  risk?: number;
  effort?: number;
  approvedRoles?: ApprovalRole[];
}): { steps: ApprovalStep[]; violations: string[] } {
  const policies = input.policies ?? DEFAULT_AUTONOMOUS_POLICIES;
  const approved = new Set(input.approvedRoles ?? []);
  const steps: ApprovalStep[] = [];
  const violations: string[] = [];
  const seenRoles = new Set<string>();

  for (const policy of policies) {
    if (!policy.appliesTo.includes(input.workflowKind)) continue;

    const thr = policy.threshold;
    if (thr) {
      const fin = input.financialImpact ?? 0;
      const risk = input.risk ?? 0;
      const effort = input.effort ?? 0;
      const hitsFinancial =
        thr.financialImpactMin == null || fin >= thr.financialImpactMin;
      const hitsRisk = thr.riskMin == null || risk >= thr.riskMin;
      const hitsEffort = thr.effortMin == null || effort >= thr.effortMin;
      if (!(hitsFinancial && hitsRisk && hitsEffort)) {
        // Threshold not met — policy does not apply
        continue;
      }
    }

    for (const role of policy.requiredRoles) {
      const key = `${policy.id}:${role}`;
      if (seenRoles.has(key)) continue;
      seenRoles.add(key);

      const status = approved.has(role) ? "approved" : "pending";
      steps.push({
        id: input.createId("approval"),
        role,
        policyId: policy.id,
        policyKey: policy.key,
        status,
        required: policy.blocking,
        rationale: policy.description,
      });
    }
  }

  // Soft validation: blocking policies must yield at least one required step
  const blockingPolicies = policies.filter(
    (p) => p.blocking && p.appliesTo.includes(input.workflowKind)
  );
  if (blockingPolicies.length > 0 && steps.filter((s) => s.required).length === 0) {
    violations.push(
      `No required approval route resolved for workflow ${input.workflowKind}`
    );
  }

  return { steps, violations };
}
