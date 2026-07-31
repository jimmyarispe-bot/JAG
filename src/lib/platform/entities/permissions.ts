import {
  assertEntityTypeRegistered,
  getEntityType,
} from "@/lib/platform/entities/registry";
import type { EntityPermissionRule } from "@/lib/platform/entities/types";

/**
 * Applications define permission rules on registration.
 * Platform evaluates them against the caller's granted permission keys
 * (from the existing identity/authorization model — not redefined here).
 */
export function listEntityPermissionRules(
  entityType: string
): EntityPermissionRule[] {
  const def = getEntityType(entityType);
  return def ? def.permissions.map((p) => ({ ...p })) : [];
}

export function resolveEntityPermission(
  entityType: string,
  action: string
): EntityPermissionRule | null {
  const def = assertEntityTypeRegistered(entityType);
  return def.permissions.find((p) => p.action === action) ?? null;
}

export function canPerformEntityAction(input: {
  entityType: string;
  action: string;
  /** Permission keys already resolved by identity/authz for the actor. */
  grantedPermissions: ReadonlySet<string> | readonly string[];
}): boolean {
  const rule = resolveEntityPermission(input.entityType, input.action);
  if (!rule) return false;
  const granted =
    input.grantedPermissions instanceof Set
      ? input.grantedPermissions
      : new Set(input.grantedPermissions);
  return granted.has(rule.permission);
}

export function assertEntityActionAllowed(input: {
  entityType: string;
  action: string;
  grantedPermissions: ReadonlySet<string> | readonly string[];
}): void {
  if (!canPerformEntityAction(input)) {
    const rule = resolveEntityPermission(input.entityType, input.action);
    throw new Error(
      rule
        ? `Permission denied: requires ${rule.permission} for ${input.entityType}.${input.action}`
        : `Permission denied: no rule for ${input.entityType}.${input.action}`
    );
  }
}
