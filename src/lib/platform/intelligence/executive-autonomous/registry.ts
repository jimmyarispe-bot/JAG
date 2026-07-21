/**
 * Autonomous preparation registry helpers (Sprint 066).
 */

import type {
  AutonomousPreparation,
  ExecutionPlan,
} from "@/lib/platform/intelligence/executive-autonomous/types";

export interface AutonomousRegistryRecord {
  id: string;
  planId: string;
  workflowKind: string;
  readiness: string;
  approvalCount: number;
  timestamp: string;
  autoExecute: false;
}

export function toRegistryRecord(
  plan: ExecutionPlan,
  prep: AutonomousPreparation | undefined,
  createId: (prefix: string) => string
): AutonomousRegistryRecord {
  return {
    id: prep?.id ?? createId("auto-reg"),
    planId: plan.id,
    workflowKind: plan.workflowKind,
    readiness: plan.readiness,
    approvalCount: plan.requiredApprovals.length,
    timestamp: plan.generatedAt,
    autoExecute: false,
  };
}
