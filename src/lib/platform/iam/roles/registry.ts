import type { PermissionGroupRegistry } from "@/lib/platform/iam/permissions/groups";
import { resolveEffectivePermissions } from "@/lib/platform/iam/permissions/inheritance";
import type { PermissionRegistry } from "@/lib/platform/iam/permissions/registry";
import type { IamRole, IamRoleKind } from "@/lib/platform/iam/types";

export type RoleRegistryDependencies = {
  now?: () => Date;
  createId?: (prefix: string) => string;
  permissions: PermissionRegistry;
  groups: PermissionGroupRegistry;
};

export class RoleRegistry {
  private readonly roles = new Map<string, IamRole>();
  private readonly byKey = new Map<string, string>();
  private readonly assignments = new Map<string, Set<string>>(); // userId → roleIds
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly permissions: PermissionRegistry;
  private readonly groups: PermissionGroupRegistry;

  constructor(dependencies: RoleRegistryDependencies) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
    this.permissions = dependencies.permissions;
    this.groups = dependencies.groups;
    this.seedSystemRoles();
  }

  private seedSystemRoles(): void {
    const adminGroup = this.groups.getByKey("iam.admin");
    const orgAdmin = this.groups.getByKey("org.admin");
    const member = this.groups.getByKey("org.member");

    this.defineRole({
      key: "SYSTEM_ADMIN",
      displayName: "System Administrator",
      kind: "system",
      organizationId: null,
      permissionGroupIds: adminGroup ? [adminGroup.id] : [],
      immutable: true,
    });
    this.defineRole({
      key: "ORG_ADMIN",
      displayName: "Organization Administrator",
      kind: "organization",
      organizationId: null,
      permissionGroupIds: orgAdmin ? [orgAdmin.id] : [],
      immutable: true,
    });
    this.defineRole({
      key: "ORG_MEMBER",
      displayName: "Organization Member",
      kind: "organization",
      organizationId: null,
      permissionGroupIds: member ? [member.id] : [],
      immutable: true,
    });
  }

  defineRole(input: {
    key: string;
    displayName: string;
    kind: IamRoleKind;
    organizationId: string | null;
    permissionGroupIds: readonly string[];
    parentRoleId?: string | null;
    immutable?: boolean;
  }): IamRole {
    const mapKey = roleMapKey(input.key, input.organizationId);
    if (this.byKey.has(mapKey)) {
      throw new Error(`Role already defined: ${input.key}`);
    }
    const role: IamRole = {
      id: this.createId("role"),
      key: input.key,
      displayName: input.displayName,
      kind: input.kind,
      organizationId: input.organizationId,
      parentRoleId: input.parentRoleId ?? null,
      permissionGroupIds: input.permissionGroupIds,
      immutable: input.immutable ?? input.kind === "system",
      createdAt: this.now().toISOString(),
    };
    this.roles.set(role.id, role);
    this.byKey.set(mapKey, role.id);
    return role;
  }

  createCustomRole(input: {
    key: string;
    displayName: string;
    organizationId: string;
    permissionGroupIds: readonly string[];
    parentRoleId?: string | null;
  }): IamRole {
    return this.defineRole({
      ...input,
      kind: "custom",
      immutable: false,
    });
  }

  getById(id: string): IamRole | undefined {
    return this.roles.get(id);
  }

  getByKey(key: string, organizationId: string | null = null): IamRole | undefined {
    const id = this.byKey.get(roleMapKey(key, organizationId));
    return id ? this.roles.get(id) : undefined;
  }

  list(kind?: IamRoleKind): readonly IamRole[] {
    const all = [...this.roles.values()];
    return kind ? all.filter((r) => r.kind === kind) : all;
  }

  assignRole(userId: string, roleId: string): void {
    if (!this.roles.has(roleId)) {
      throw new Error(`Unknown role: ${roleId}`);
    }
    const set = this.assignments.get(userId) ?? new Set<string>();
    set.add(roleId);
    this.assignments.set(userId, set);
  }

  revokeRole(userId: string, roleId: string): void {
    this.assignments.get(userId)?.delete(roleId);
  }

  rolesForUser(userId: string): readonly IamRole[] {
    const ids = this.assignments.get(userId);
    if (!ids) return [];
    return [...ids]
      .map((id) => this.roles.get(id))
      .filter((r): r is IamRole => Boolean(r));
  }

  permissionsForUser(userId: string): Set<string> {
    const roles = this.rolesForUser(userId);
    const groupIds = roles.flatMap((r) => [...r.permissionGroupIds]);
    // Inherit parent role groups recursively.
    const visited = new Set<string>();
    const queue = [...roles];
    while (queue.length > 0) {
      const role = queue.pop()!;
      if (visited.has(role.id)) continue;
      visited.add(role.id);
      if (role.parentRoleId) {
        const parent = this.roles.get(role.parentRoleId);
        if (parent) {
          groupIds.push(...parent.permissionGroupIds);
          queue.push(parent);
        }
      }
    }
    return resolveEffectivePermissions(this.permissions, this.groups, {
      groupIds,
    });
  }
}

function roleMapKey(key: string, organizationId: string | null): string {
  return `${organizationId ?? "system"}:${key}`;
}
