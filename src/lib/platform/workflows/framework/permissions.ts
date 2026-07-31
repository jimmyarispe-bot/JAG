import type {
  WorkflowDefinition,
  WorkflowParticipantRole,
  WorkflowTransitionDefinition,
} from "@/lib/platform/workflows/framework/types";
import { hasParticipantRole } from "@/lib/platform/workflows/framework/participants";
import type { WorkflowParticipantBinding } from "@/lib/platform/workflows/framework/types";

export function resolveWorkflowPermission(
  definition: WorkflowDefinition,
  action: string
): string | null {
  return definition.permissions.find((p) => p.action === action)?.permission ?? null;
}

export function canPerformWorkflowAction(input: {
  definition: WorkflowDefinition;
  action: string;
  grantedPermissions: ReadonlySet<string> | readonly string[];
}): boolean {
  const permission = resolveWorkflowPermission(input.definition, input.action);
  if (!permission) return true; // no rule → not gated at definition level
  const granted =
    input.grantedPermissions instanceof Set
      ? input.grantedPermissions
      : new Set(input.grantedPermissions);
  return granted.has(permission);
}

export function canFireTransition(input: {
  transition: WorkflowTransitionDefinition;
  participants: WorkflowParticipantBinding[];
  actorUserId?: string | null;
  actorParticipantRole?: WorkflowParticipantRole | null;
  grantedPermissions?: ReadonlySet<string> | readonly string[];
}): boolean {
  if (input.transition.permission) {
    const granted =
      input.grantedPermissions instanceof Set
        ? input.grantedPermissions
        : new Set(input.grantedPermissions ?? []);
    if (!granted.has(input.transition.permission)) return false;
  }

  const allowed = input.transition.allowedParticipantRoles;
  if (!allowed || allowed.length === 0) return true;

  if (
    input.actorParticipantRole &&
    allowed.includes(input.actorParticipantRole)
  ) {
    return true;
  }

  return allowed.some((role) =>
    hasParticipantRole(input.participants, role, input.actorUserId)
  );
}

export function assertCanFireTransition(input: Parameters<typeof canFireTransition>[0]): void {
  if (!canFireTransition(input)) {
    throw new Error(
      `Permission denied for transition "${input.transition.key}"`
    );
  }
}
