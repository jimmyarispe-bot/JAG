import { EntityService } from "@/lib/platform/entities";
import {
  listWorkflowInstances,
  startWorkflowInstance,
} from "@/lib/platform/workflows/framework/instance";
import type {
  StartWorkflowInput,
  WorkflowInstance,
} from "@/lib/platform/workflows/framework/types";

/**
 * Attach a workflow instance to a Universal Entity Framework entity.
 * Applications decide which entity types support which workflows via definition.entityTypes.
 */
export function startWorkflowForEntity(
  input: StartWorkflowInput & {
    entityType: string;
    entityId: string;
  }
): WorkflowInstance {
  if (!EntityService.isRegistered(input.entityType)) {
    throw new Error(
      `Entity type "${input.entityType}" must be registered before attaching workflows`
    );
  }
  const entity = EntityService.get(input.entityType, input.entityId);
  if (!entity) {
    throw new Error(
      `Entity not found: ${input.entityType}/${input.entityId}`
    );
  }

  const instance = startWorkflowInstance({
    ...input,
    entityType: input.entityType,
    entityId: input.entityId,
    organizationId: input.organizationId ?? entity.organizationId,
  });

  EntityService.recordActivity({
    entityType: input.entityType,
    entityId: input.entityId,
    eventType: "workflow.started",
    title: `Workflow started: ${instance.definitionId}`,
    summary: `Instance ${instance.id} at state ${instance.currentState}`,
    actorUserId: input.actorUserId,
    refId: instance.id,
    occurredAt: instance.createdAt,
    metadata: {
      workflowInstanceId: instance.id,
      workflowDefinitionId: instance.definitionId,
    },
  });

  return instance;
}

export function listWorkflowsForEntity(
  entityType: string,
  entityId: string
): WorkflowInstance[] {
  return listWorkflowInstances({ entityType, entityId });
}
