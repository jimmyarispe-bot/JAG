import type {
  WorkflowDefinition,
  WorkflowParticipantBinding,
  WorkflowParticipantRole,
} from "@/lib/platform/workflows/framework/types";

/**
 * Workflow participant roles are not application roles.
 * Applications map domain roles via `domainRole` on bindings.
 */
export const WORKFLOW_PARTICIPANT_ROLES: readonly WorkflowParticipantRole[] = [
  "owner",
  "reviewer",
  "approver",
  "observer",
  "assignee",
] as const;

export function bindParticipant(input: {
  role: WorkflowParticipantRole;
  userId?: string | null;
  displayName?: string | null;
  domainRole?: string | null;
}): WorkflowParticipantBinding {
  return {
    role: input.role,
    userId: input.userId ?? null,
    displayName: input.displayName ?? null,
    domainRole: input.domainRole ?? null,
  };
}

export function listRequiredParticipants(
  definition: WorkflowDefinition
): WorkflowParticipantRole[] {
  return definition.participants.filter((p) => p.required).map((p) => p.role);
}

export function hasParticipantRole(
  participants: WorkflowParticipantBinding[],
  role: WorkflowParticipantRole,
  userId?: string | null
): boolean {
  return participants.some(
    (p) =>
      p.role === role &&
      (userId == null || p.userId == null || p.userId === userId)
  );
}

export function assertRequiredParticipants(
  definition: WorkflowDefinition,
  participants: WorkflowParticipantBinding[]
): void {
  for (const role of listRequiredParticipants(definition)) {
    if (!participants.some((p) => p.role === role)) {
      throw new Error(
        `Workflow "${definition.id}" requires participant role "${role}"`
      );
    }
  }
}
