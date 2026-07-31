import type {
  DocumentDefinition,
  DocumentPermissionAction,
} from "@/jag/documents/contracts/definitions";

/** Fail-open when no permissions declared on the definition. */
export function checkDocumentPermission(input: {
  definition: DocumentDefinition;
  action: DocumentPermissionAction;
  actorRoles?: readonly string[];
  actorPermissionKeys?: readonly string[];
}): { allowed: boolean; reason?: string } {
  const rules = input.definition.permissions ?? [];
  const relevant = rules.filter((r) => r.action === input.action);
  if (relevant.length === 0) return { allowed: true };

  const roles = new Set(input.actorRoles ?? []);
  const keys = new Set(input.actorPermissionKeys ?? []);

  for (const rule of relevant) {
    const roleOk = !rule.roles?.length || rule.roles.some((r) => roles.has(r));
    const keyOk = !rule.permissionKey || keys.has(rule.permissionKey);
    if (roleOk && keyOk) return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Action "${input.action}" is not permitted for the current actor`,
  };
}
