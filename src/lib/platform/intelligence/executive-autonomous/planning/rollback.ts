/**
 * Rollback planning (Sprint 066).
 */

import type {
  RollbackPlan,
  WorkflowTemplate,
} from "@/lib/platform/intelligence/executive-autonomous/types";

export function buildRollbackPlan(
  template: WorkflowTemplate,
  optionTitle: string
): RollbackPlan {
  return {
    conditions: [
      ...template.rollbackDefaults.conditions,
      `Human authorization withdrawn for "${optionTitle}"`,
    ],
    recoverySteps: [...template.rollbackDefaults.recoverySteps],
    notifications: [...template.rollbackDefaults.notifications],
    impactAssessment: template.rollbackDefaults.impactAssessment,
  };
}
