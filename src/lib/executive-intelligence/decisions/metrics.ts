/**
 * DecisionMetrics — dashboard aggregation (deterministic counts).
 */

import { createDecisionWorkflow } from "@/lib/executive-intelligence/decisions/workflow";
import { listDecisionsForOrganization } from "@/lib/executive-intelligence/decisions/store";
import type {
  DecisionSummary,
  JagDecision,
} from "@/lib/executive-intelligence/decisions/types";

export type DecisionMetricsService = {
  summarize(organizationId: string, now?: Date): DecisionSummary;
};

function bump(map: Record<string, number>, key: string): void {
  const k = key.trim() || "Unassigned";
  map[k] = (map[k] ?? 0) + 1;
}

export function createDecisionMetricsService(): DecisionMetricsService {
  const workflow = createDecisionWorkflow();

  return {
    summarize(organizationId, now = new Date()) {
      const decisions = listDecisionsForOrganization(organizationId);
      const openRows = decisions.filter((d) => workflow.isOpen(d.status));
      const overdue = openRows.filter(
        (d) => d.dueDate != null && Date.parse(d.dueDate) < now.getTime()
      );
      const critical = openRows.filter((d) => d.severity === "Critical");
      const recentlyResolved = decisions.filter(
        (d) =>
          (d.status === "Resolved" || d.status === "Closed") &&
          d.resolvedAt != null &&
          now.getTime() - Date.parse(d.resolvedAt) <= 14 * 24 * 60 * 60 * 1000
      );

      const byDepartment: Record<string, number> = {};
      const byBusinessUnit: Record<string, number> = {};
      for (const d of openRows) {
        bump(byDepartment, d.department ?? "Unassigned");
        bump(byBusinessUnit, d.businessUnit ?? "Unassigned");
      }

      return {
        open: openRows.length,
        overdue: overdue.length,
        critical: critical.length,
        recentlyResolved: recentlyResolved.length,
        byDepartment: Object.freeze(byDepartment),
        byBusinessUnit: Object.freeze(byBusinessUnit),
      };
    },
  };
}

export function getDecisionSummary(
  organizationId: string,
  now?: Date
): DecisionSummary {
  return createDecisionMetricsService().summarize(organizationId, now);
}

export function listOpenDecisions(
  organizationId: string
): readonly JagDecision[] {
  const workflow = createDecisionWorkflow();
  return Object.freeze(
    listDecisionsForOrganization(organizationId).filter((d) =>
      workflow.isOpen(d.status)
    )
  );
}
