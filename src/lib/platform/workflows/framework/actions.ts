import { AutomationService } from "@/lib/platform/automation/operating";
import {
  buildAutomationDecisionMergeKey,
  DecisionService,
} from "@/lib/platform/decisions";
import type { DecisionOwnerRole, DecisionPriority } from "@/lib/platform/decisions";
import { EntityService } from "@/lib/platform/entities";
import { NotificationService } from "@/lib/platform/notifications";
import type {
  WorkflowAction,
  WorkflowInstance,
} from "@/lib/platform/workflows/framework/types";

export type WorkflowActionResult = {
  type: WorkflowAction["type"];
  ok: boolean;
  detail: string;
  refId: string | null;
};

/**
 * Execute platform actions only — no application-specific handlers.
 */
export function executeWorkflowAction(input: {
  action: WorkflowAction;
  instance: WorkflowInstance;
  actorUserId?: string | null;
  now: string;
}): WorkflowActionResult {
  const { action, instance, actorUserId, now } = input;
  try {
    switch (action.type) {
      case "create_decision": {
        const title = String(action.params.title ?? instance.definitionId);
        const priority = (action.params.priority as DecisionPriority) ?? "medium";
        const subjectKey = String(
          action.params.subjectKey ?? instance.entityId ?? instance.id
        );
        const mergeKey = buildAutomationDecisionMergeKey({
          organizationId: instance.organizationId,
          ruleId: `workflow:${instance.definitionId}`,
          subjectKey,
        });
        const { decision, created } = DecisionService.create({
          mergeKey,
          title,
          description: String(
            action.params.description ??
              `Created by workflow ${instance.definitionId}`
          ),
          organizationId: instance.organizationId,
          applicationId: instance.applicationId,
          priority,
          ownerRole: (action.params.ownerRole as DecisionOwnerRole) ?? undefined,
          actorUserId,
          now,
          historyAction: "created_by_automation",
          reason: `Workflow instance ${instance.id}`,
        });
        return {
          type: action.type,
          ok: true,
          detail: created
            ? `Created decision ${decision.id}`
            : `Reused decision ${decision.id}`,
          refId: decision.id,
        };
      }

      case "assign_decision": {
        const decisionId = String(action.params.decisionId ?? "");
        if (!decisionId) {
          throw new Error("assign_decision requires decisionId");
        }
        const ownerRole =
          (action.params.ownerRole as DecisionOwnerRole) ?? "executive_director";
        const decision = DecisionService.assign({
          decisionId,
          ownerRole,
          ownerUserId: (action.params.ownerUserId as string | null) ?? null,
          ownerDisplayName:
            (action.params.ownerDisplayName as string | null) ?? null,
          actorUserId,
          now,
          notify: action.params.notify !== false,
          reason: `Workflow ${instance.definitionId}`,
        });
        return {
          type: action.type,
          ok: true,
          detail: `Assigned ${decision.id}`,
          refId: decision.id,
        };
      }

      case "send_notification": {
        const decisionId = String(
          action.params.decisionId ?? instance.metadata.lastDecisionId ?? ""
        );
        const recipientId = String(action.params.recipientId ?? "");
        if (!decisionId || !recipientId) {
          throw new Error(
            "send_notification requires decisionId (or prior create_decision) and recipientId"
          );
        }
        const note = NotificationService.dispatchAssignment({
          decisionId,
          recipientId,
          organizationId: instance.organizationId,
          applicationId: instance.applicationId,
          priority: (action.params.priority as DecisionPriority) ?? "medium",
          title: String(action.params.title ?? "Workflow notification"),
          body: String(
            action.params.body ?? `Workflow ${instance.definitionId} update`
          ),
          type: "automation_alert",
          actorUserId,
          now,
        });
        return {
          type: action.type,
          ok: true,
          detail: `Notification ${note.id}`,
          refId: note.id,
        };
      }

      case "run_automation": {
        const trigger = action.params.trigger as
          | Parameters<typeof AutomationService.runTrigger>[0]
          | undefined;
        if (!trigger) {
          throw new Error("run_automation requires trigger");
        }
        const facts = {
          organizationId: instance.organizationId,
          applicationId: instance.applicationId ?? undefined,
          observedAt: now,
          ...(typeof action.params.facts === "object" && action.params.facts
            ? (action.params.facts as Record<string, unknown>)
            : {}),
        };
        const batch = AutomationService.runTrigger(trigger, facts as never, {
          now,
          actorUserId,
        });
        return {
          type: action.type,
          ok: true,
          detail: `Automation runs=${batch.runs.length} decisions=${batch.decisionsCreated.length}`,
          refId: batch.runs[0]?.id ?? null,
        };
      }

      case "record_timeline": {
        if (!instance.entityType || !instance.entityId) {
          throw new Error("record_timeline requires entity attachment");
        }
        if (!EntityService.isRegistered(instance.entityType)) {
          throw new Error(
            `Entity type "${instance.entityType}" is not registered`
          );
        }
        const entry = EntityService.recordActivity({
          entityType: instance.entityType,
          entityId: instance.entityId,
          eventType: String(action.params.eventType ?? "workflow.event"),
          title: String(action.params.title ?? instance.definitionId),
          summary: (action.params.summary as string | null) ?? null,
          actorUserId,
          refId: instance.id,
          occurredAt: now,
          metadata: {
            workflowInstanceId: instance.id,
            workflowDefinitionId: instance.definitionId,
          },
        });
        return {
          type: action.type,
          ok: true,
          detail: `Timeline ${entry.id}`,
          refId: entry.id,
        };
      }

      case "attach_document": {
        if (!instance.entityType || !instance.entityId) {
          throw new Error("attach_document requires entity attachment");
        }
        const doc = EntityService.attachDocument({
          entityType: instance.entityType,
          entityId: instance.entityId,
          title: String(action.params.title ?? "Workflow document"),
          organizationId: instance.organizationId,
          storageRef: (action.params.storageRef as string | null) ?? null,
          mimeType: (action.params.mimeType as string | null) ?? null,
          ownerUserId: actorUserId ?? null,
          now,
          metadata: { workflowInstanceId: instance.id },
        });
        return {
          type: action.type,
          ok: true,
          detail: `Document ${doc.id}`,
          refId: doc.id,
        };
      }

      case "update_entity_metadata": {
        if (!instance.entityType || !instance.entityId) {
          throw new Error("update_entity_metadata requires entity attachment");
        }
        const existing = EntityService.get(
          instance.entityType,
          instance.entityId
        );
        if (!existing) {
          throw new Error(
            `Entity not found: ${instance.entityType}/${instance.entityId}`
          );
        }
        const patch =
          typeof action.params.metadata === "object" && action.params.metadata
            ? (action.params.metadata as Record<string, unknown>)
            : {};
        const updated = EntityService.upsert({
          ...existing,
          updatedAt: now,
          metadata: { ...existing.metadata, ...patch },
        });
        return {
          type: action.type,
          ok: true,
          detail: `Updated metadata on ${updated.id}`,
          refId: updated.id,
        };
      }

      default:
        throw new Error(`Unknown workflow action type`);
    }
  } catch (err) {
    return {
      type: action.type,
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
      refId: null,
    };
  }
}

export function executeWorkflowActions(input: {
  actions: WorkflowAction[] | undefined;
  instance: WorkflowInstance;
  actorUserId?: string | null;
  now: string;
}): { results: WorkflowActionResult[]; details: string[]; lastDecisionId: string | null } {
  const results: WorkflowActionResult[] = [];
  let lastDecisionId: string | null =
    typeof input.instance.metadata.lastDecisionId === "string"
      ? input.instance.metadata.lastDecisionId
      : null;

  for (const action of input.actions ?? []) {
    const working: WorkflowInstance = {
      ...input.instance,
      metadata: {
        ...input.instance.metadata,
        ...(lastDecisionId ? { lastDecisionId } : {}),
      },
    };
    const result = executeWorkflowAction({
      action,
      instance: working,
      actorUserId: input.actorUserId,
      now: input.now,
    });
    results.push(result);
    if (result.ok && result.refId && action.type === "create_decision") {
      lastDecisionId = result.refId;
    }
  }

  return {
    results,
    details: results.map((r) => `${r.type}:${r.ok ? "ok" : "fail"}:${r.detail}`),
    lastDecisionId,
  };
}
