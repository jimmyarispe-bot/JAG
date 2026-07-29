/**
 * Validate an execution plan before hosts run contributors.
 */

import type { EducationContributorDescriptor } from "./EducationDependencyGraph";
import type { EducationExecutionPlan } from "./EducationExecutionPlan";
import type { EducationPlanValidationIssue } from "./EducationPlanResult";

export function validateEducationExecutionPlan(input: {
  plan: EducationExecutionPlan;
  catalog: readonly EducationContributorDescriptor[];
  selectedIds: readonly string[];
}): EducationPlanValidationIssue[] {
  const issues: EducationPlanValidationIssue[] = [];
  const catalogById = new Map(
    input.catalog.map((c) => [c.contributorId, c] as const)
  );
  const selected = new Set(input.selectedIds);
  const ordered = input.plan.orderedContributorIds;
  const orderIndex = new Map(ordered.map((id, i) => [id, i] as const));

  if (ordered.length === 0) {
    issues.push({
      code: "EMPTY_PLAN",
      message: "Execution plan includes no contributors",
      severity: "warning",
    });
  }

  for (const id of selected) {
    if (!catalogById.has(id)) {
      issues.push({
        code: "UNKNOWN_CONTRIBUTOR",
        message: `Unknown contributor in plan: ${id}`,
        contributorId: id,
        severity: "error",
      });
    }
  }

  for (const id of selected) {
    const desc = catalogById.get(id);
    if (!desc) continue;
    for (const dep of desc.dependsOn) {
      if (!selected.has(dep)) {
        issues.push({
          code: "MISSING_DEPENDENCY",
          message: `${id} requires ${dep}, which is not scheduled`,
          contributorId: id,
          severity: "error",
        });
        continue;
      }
      const depOrder = orderIndex.get(dep);
      const selfOrder = orderIndex.get(id);
      if (
        depOrder !== undefined &&
        selfOrder !== undefined &&
        depOrder >= selfOrder
      ) {
        issues.push({
          code: "DEPENDENCY_ORDER",
          message: `${id} must run after dependency ${dep}`,
          contributorId: id,
          severity: "error",
        });
      }
    }
  }

  return issues;
}
