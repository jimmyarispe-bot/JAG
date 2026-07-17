import type { IamPermissionGroup } from "@/lib/platform/iam/types";

export const IAM_CORE_PERMISSION_GROUPS: readonly IamPermissionGroup[] = [
  {
    id: "grp-iam-admin",
    key: "iam.admin",
    name: "IAM Administrators",
    permissionKeys: [
      "iam.admin",
      "iam.audit.read",
      "iam.delegation.grant",
      "iam.delegation.revoke",
      "iam.break_glass.request",
      "iam.break_glass.approve",
      "org.read",
      "org.write",
      "org.settings",
      "org.lifecycle",
      "users.read",
      "users.manage",
      "roles.assign",
      "roles.manage",
      "session.manage",
    ],
  },
  {
    id: "grp-org-admin",
    key: "org.admin",
    name: "Organization Administrators",
    permissionKeys: [
      "org.read",
      "org.write",
      "org.settings",
      "org.lifecycle",
      "users.read",
      "users.manage",
      "roles.assign",
      "iam.delegation.grant",
      "iam.delegation.revoke",
    ],
  },
  {
    id: "grp-org-member",
    key: "org.member",
    name: "Organization Members",
    permissionKeys: ["org.read", "users.read"],
  },
  {
    id: "grp-break-glass-operator",
    key: "iam.break_glass.operator",
    name: "Break Glass Operators",
    permissionKeys: [
      "iam.break_glass.request",
      "iam.break_glass.approve",
      "iam.audit.read",
    ],
  },
] as const;

export class PermissionGroupRegistry {
  private readonly byId = new Map<string, IamPermissionGroup>();
  private readonly byKey = new Map<string, IamPermissionGroup>();

  constructor(seed: readonly IamPermissionGroup[] = IAM_CORE_PERMISSION_GROUPS) {
    for (const group of seed) {
      this.register(group);
    }
  }

  register(group: IamPermissionGroup): void {
    if (this.byId.has(group.id) || this.byKey.has(group.key)) {
      throw new Error(`Permission group already registered: ${group.key}`);
    }
    this.byId.set(group.id, group);
    this.byKey.set(group.key, group);
  }

  getById(id: string): IamPermissionGroup | undefined {
    return this.byId.get(id);
  }

  getByKey(key: string): IamPermissionGroup | undefined {
    return this.byKey.get(key);
  }

  list(): readonly IamPermissionGroup[] {
    return [...this.byId.values()];
  }
}
