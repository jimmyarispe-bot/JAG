import { WorkflowService } from "@/lib/platform/workflows/framework";
import type {
  WorkflowAdapterResult,
  WorkflowStartRequest,
  WorkflowTransitionRequest,
} from "@/applications/academyos/workflow-adapters/types";

/**
 * Thin bridge to JAG Workflow Framework.
 * Domain / application code must call adapters — never WorkflowService directly.
 */
export const AcademyWorkflowRuntime = {
  start(request: WorkflowStartRequest): WorkflowAdapterResult {
    const instance = WorkflowService.start({
      definitionId: request.definitionId,
      entityType: request.entityType,
      entityId: request.entityId,
      actorUserId: request.actorUserId ?? null,
      organizationId: request.organizationId ?? null,
      facts: request.facts ?? {},
      reason: request.reason ?? null,
      participants: [
        {
          role: "owner",
          userId: request.actorUserId ?? null,
          displayName: null,
          domainRole: "academyos",
        },
      ],
      metadata: { application: "academyos" },
    });

    return {
      instanceId: instance.id,
      definitionId: instance.definitionId,
      currentState: instance.currentState,
      status: instance.status,
    };
  },

  transition(request: WorkflowTransitionRequest): WorkflowAdapterResult {
    const instance = WorkflowService.transition({
      instanceId: request.instanceId,
      transitionKey: request.transitionKey,
      actorUserId: request.actorUserId ?? null,
      actorParticipantRole: "owner",
      grantedPermissions: request.grantedPermissions,
      reason: request.reason ?? null,
      factUpdates: request.factUpdates,
    });

    return {
      instanceId: instance.id,
      definitionId: instance.definitionId,
      currentState: instance.currentState,
      status: instance.status,
    };
  },

  listForEntity(entityType: string, entityId: string) {
    return WorkflowService.listForEntity(entityType, entityId).map((i) => ({
      instanceId: i.id,
      definitionId: i.definitionId,
      currentState: i.currentState,
      status: i.status,
    }));
  },
};
