/**
 * Dependency / prerequisite resolution (Sprint 066).
 */

import type {
  ApprovalStep,
  PlanPrerequisite,
  WorkflowKind,
} from "@/lib/platform/intelligence/executive-autonomous/types";

export function resolvePrerequisites(input: {
  workflowKind: WorkflowKind;
  approvals: ApprovalStep[];
  createId: (prefix: string) => string;
  satisfiedIds?: string[];
  hasBudgetLine?: boolean;
  hasRequiredInfo?: boolean;
  hasResources?: boolean;
  complianceClear?: boolean;
}): PlanPrerequisite[] {
  const satisfied = new Set(input.satisfiedIds ?? []);
  const items: PlanPrerequisite[] = [];

  for (const step of input.approvals.filter((a) => a.required)) {
    const id = `prereq-approval-${step.role}`;
    items.push({
      id,
      kind: "approval",
      label: `${step.role.replace(/_/g, " ")} approval`,
      satisfied: step.status === "approved" || satisfied.has(id),
      blocking: true,
      detail: step.rationale,
    });
  }

  const infoId = input.createId("prereq-info");
  items.push({
    id: infoId,
    kind: "information",
    label: "Required information pack complete",
    satisfied: input.hasRequiredInfo === true || satisfied.has(infoId),
    blocking: true,
    detail: "Missing narratives, owners, or evidence blocks preparation completeness",
  });

  const resourceId = input.createId("prereq-resource");
  items.push({
    id: resourceId,
    kind: "resource",
    label: "Resource capacity available",
    satisfied: input.hasResources !== false || satisfied.has(resourceId),
    blocking: input.workflowKind === "staffing" || input.workflowKind === "operations",
    detail: "Owner bandwidth / FTE capacity",
  });

  if (
    input.workflowKind === "finance" ||
    input.workflowKind === "grants" ||
    input.workflowKind === "staffing"
  ) {
    const budgetId = input.createId("prereq-budget");
    items.push({
      id: budgetId,
      kind: "budget",
      label: "Budget prerequisite satisfied",
      satisfied: input.hasBudgetLine === true || satisfied.has(budgetId),
      blocking: true,
      detail: "Budget line / match funding must be identified before execution",
    });
  }

  if (input.workflowKind === "compliance" || input.workflowKind === "grants") {
    const complianceId = input.createId("prereq-compliance");
    items.push({
      id: complianceId,
      kind: "compliance",
      label: "Compliance prerequisite clear",
      satisfied: input.complianceClear !== false || satisfied.has(complianceId),
      blocking: true,
      detail: "Policy / regulatory checks must pass before launch",
    });
  }

  return items;
}
