import type {
  ProcessDefinition,
  ProcessPermissionAction,
} from "@/jag/processes/contracts/definitions";

/**
 * Declarative permission check against definition.permissions.
 * Fail-open when no permissions are declared (packages may tighten later via org policy).
 */
export function checkProcessPermission(input: {
  definition: ProcessDefinition;
  action: ProcessPermissionAction;
  actorRoles?: readonly string[];
  actorPermissionKeys?: readonly string[];
}): { allowed: boolean; reason?: string } {
  const rules = input.definition.permissions ?? [];
  const relevant = rules.filter((r) => r.action === input.action);
  if (relevant.length === 0) {
    return { allowed: true };
  }

  const roles = new Set(input.actorRoles ?? []);
  const keys = new Set(input.actorPermissionKeys ?? []);

  for (const rule of relevant) {
    const roleOk =
      !rule.roles?.length || rule.roles.some((r) => roles.has(r));
    const keyOk =
      !rule.permissionKey || keys.has(rule.permissionKey);
    if (roleOk && keyOk) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reason: `Action "${input.action}" is not permitted for the current actor`,
  };
}
