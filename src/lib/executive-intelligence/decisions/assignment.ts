/**
 * DecisionAssignment — Person / Team / Business Unit with reassignment history.
 */

import { randomUUID } from "node:crypto";
import {
  appendDecisionTimeline,
  getDecision,
  getDecisionReassignments,
  recordDecisionReassignment,
  upsertDecision,
} from "@/lib/executive-intelligence/decisions/store";
import { createDecisionWorkflow } from "@/lib/executive-intelligence/decisions/workflow";
import type {
  AssignmentTargetType,
  DecisionAssignment,
  DecisionReassignment,
  JagDecision,
} from "@/lib/executive-intelligence/decisions/types";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";

export type DecisionAssignmentService = {
  assign(input: {
    organizationId: string;
    decisionId: string;
    actor: string;
    targetType: AssignmentTargetType;
    targetId: string;
    targetLabel: string;
    reason?: string;
  }): JagDecision | null;
  listHistory(decisionId: string): readonly DecisionReassignment[];
};

export function createDecisionAssignmentService(): DecisionAssignmentService {
  const workflow = createDecisionWorkflow();

  return {
    assign(input) {
      const current = getDecision(input.organizationId, input.decisionId);
      if (!current) return null;

      const now = new Date().toISOString();
      const nextOwner: DecisionAssignment = {
        targetType: input.targetType,
        targetId: input.targetId,
        targetLabel: input.targetLabel,
        assignedAt: now,
        assignedBy: input.actor,
      };

      const reassignment: DecisionReassignment = {
        id: randomUUID(),
        at: now,
        actor: input.actor,
        from: current.owner,
        to: nextOwner,
        reason: input.reason ?? "Assignment update",
      };
      recordDecisionReassignment(current.id, reassignment);

      let status = current.status;
      if (status === "Detected" || status === "Needs Review") {
        workflow.assertTransition(status, "Assigned");
        status = "Assigned";
      }

      const updated: JagDecision = {
        ...current,
        owner: nextOwner,
        status,
        updatedAt: now,
      };
      upsertDecision(updated);

      appendDecisionTimeline({
        id: randomUUID(),
        organizationId: input.organizationId,
        decisionId: current.id,
        kind: current.owner ? "reassigned" : "assigned",
        at: now,
        actor: input.actor,
        message: current.owner
          ? `Reassigned from ${current.owner.targetLabel} to ${nextOwner.targetLabel} (${nextOwner.targetType}).`
          : `Assigned to ${nextOwner.targetLabel} (${nextOwner.targetType}).`,
        fromStatus: current.status,
        toStatus: status,
        metadata: {
          targetType: nextOwner.targetType,
          targetId: nextOwner.targetId,
        },
      });

      emitJagPlatformEvent({
        organizationId: input.organizationId,
        sourceModule: "decisions",
        entityType: "JagDecision",
        entityId: current.id,
        eventType: current.owner
          ? "decision.reassigned"
          : "decision.assigned",
        actor: input.actor,
        metadata: {
          targetType: nextOwner.targetType,
          targetLabel: nextOwner.targetLabel,
          status,
        },
      });

      return updated;
    },

    listHistory(decisionId) {
      return getDecisionReassignments(decisionId);
    },
  };
}
