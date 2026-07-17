import type { PermissionRegistry } from "@/lib/platform/iam/permissions/registry";
import type { PermissionGroupRegistry } from "@/lib/platform/iam/permissions/groups";

/**
 * Expand permission keys through parent inheritance and permission groups.
 * Child grant implies ancestor permissions (up the parentKey chain).
 * Group membership expands to all keys in the group, then inheritance applies.
 */
export function expandPermissionKeys(
  registry: PermissionRegistry,
  keys: readonly string[]
): Set<string> {
  const result = new Set<string>();
  const queue = [...keys];

  while (queue.length > 0) {
    const key = queue.pop()!;
    if (result.has(key)) continue;
    result.add(key);
    const def = registry.get(key);
    if (def?.parentKey && !result.has(def.parentKey)) {
      queue.push(def.parentKey);
    }
  }

  return result;
}

export function expandPermissionGroups(
  groups: PermissionGroupRegistry,
  groupIds: readonly string[]
): Set<string> {
  const keys = new Set<string>();
  for (const id of groupIds) {
    const group = groups.getById(id) ?? groups.getByKey(id);
    if (!group) continue;
    for (const key of group.permissionKeys) {
      keys.add(key);
    }
  }
  return keys;
}

export function resolveEffectivePermissions(
  registry: PermissionRegistry,
  groups: PermissionGroupRegistry,
  input: {
    directKeys?: readonly string[];
    groupIds?: readonly string[];
  }
): Set<string> {
  const fromGroups = expandPermissionGroups(groups, input.groupIds ?? []);
  const combined = new Set<string>([...fromGroups, ...(input.directKeys ?? [])]);
  return expandPermissionKeys(registry, [...combined]);
}
