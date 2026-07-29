import type {
  PermissionResolutionInput,
  PermissionResolver,
} from "./identity-types";

/**
 * Resolves effective permission keys.
 * Roles are grant sources only — authorize() checks permission keys.
 */
export class DefaultPermissionResolver implements PermissionResolver {
  resolve(input: PermissionResolutionInput): readonly string[] {
    const set = new Set<string>();

    for (const permission of input.basePermissions) {
      set.add(permission);
    }

    const catalog = input.rolePermissionCatalog;
    if (catalog) {
      for (const role of input.roles) {
        const fromRole = catalog[role];
        if (!fromRole) continue;
        for (const permission of fromRole) {
          set.add(permission);
        }
      }
    }

    if (input.breakGlassPermissions) {
      for (const permission of input.breakGlassPermissions) {
        set.add(permission);
      }
    }

    if (input.delegation?.scope) {
      // Delegation is an allow-list mask over the resolved set.
      const allowed = new Set(input.delegation.scope);
      return [...set].filter((p) => allowed.has(p));
    }

    return [...set];
  }

  authorize(permissions: readonly string[], permission: string): boolean {
    return permissions.includes(permission);
  }
}

export function createPermissionResolver(): PermissionResolver {
  return new DefaultPermissionResolver();
}
