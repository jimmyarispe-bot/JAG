/**
 * Plan validation / readiness scoring (Sprint 066).
 */

import type {
  ApprovalStep,
  PlanPrerequisite,
  ReadinessState,
} from "@/lib/platform/intelligence/executive-autonomous/types";

export function assessReadiness(input: {
  prerequisites: PlanPrerequisite[];
  approvals: ApprovalStep[];
  scheduled?: boolean;
  policyViolations?: string[];
}): { state: ReadinessState; reasons: string[] } {
  const reasons: string[] = [];

  if (input.policyViolations?.length) {
    for (const v of input.policyViolations) reasons.push(`Policy violation: ${v}`);
    return { state: "blocked", reasons };
  }

  const blockingUnmet = input.prerequisites.filter((p) => p.blocking && !p.satisfied);
  const pendingApprovals = input.approvals.filter(
    (a) => a.required && a.status === "pending"
  );
  const waitingInfo = blockingUnmet.filter((p) => p.kind === "information");
  const waitingResources = blockingUnmet.filter((p) => p.kind === "resource");
  const waitingBudget = blockingUnmet.filter(
    (p) => p.kind === "budget" || p.kind === "compliance"
  );

  if (pendingApprovals.length > 0) {
    for (const a of pendingApprovals) {
      reasons.push(`Waiting approval from ${a.role.replace(/_/g, " ")}`);
    }
    return { state: "waiting_approval", reasons };
  }

  if (waitingInfo.length > 0) {
    for (const p of waitingInfo) reasons.push(p.label);
    return { state: "waiting_information", reasons };
  }

  if (waitingResources.length > 0) {
    for (const p of waitingResources) reasons.push(p.label);
    return { state: "waiting_resources", reasons };
  }

  if (waitingBudget.length > 0) {
    for (const p of waitingBudget) reasons.push(p.label);
    return { state: "blocked", reasons };
  }

  if (blockingUnmet.length > 0) {
    for (const p of blockingUnmet) reasons.push(p.label);
    return { state: "blocked", reasons };
  }

  if (input.scheduled) {
    reasons.push("Plan is scheduled pending start window");
    return { state: "scheduled", reasons };
  }

  reasons.push("Prerequisites and approvals satisfied — awaiting human authorization to execute");
  return { state: "ready", reasons };
}
