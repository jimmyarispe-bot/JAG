/**
 * Central permission registry — product-agnostic keys only.
 */

import type { IamPermissionDefinition } from "@/lib/platform/iam/types";

/** Baseline platform IAM permissions (no product surface names). */
export const IAM_CORE_PERMISSIONS: readonly IamPermissionDefinition[] = [
  {
    key: "iam.admin",
    name: "IAM Administration",
    description: "Manage roles, permissions, and platform IAM settings",
    module: "iam",
    parentKey: null,
  },
  {
    key: "iam.audit.read",
    name: "IAM Audit Read",
    description: "View IAM audit events",
    module: "iam",
    parentKey: null,
  },
  {
    key: "iam.delegation.grant",
    name: "Grant Delegation",
    description: "Grant temporary delegated authority",
    module: "iam",
    parentKey: null,
  },
  {
    key: "iam.delegation.revoke",
    name: "Revoke Delegation",
    description: "Revoke temporary delegated authority",
    module: "iam",
    parentKey: null,
  },
  {
    key: "iam.break_glass.request",
    name: "Request Break Glass",
    description: "Request emergency access",
    module: "iam",
    parentKey: null,
  },
  {
    key: "iam.break_glass.approve",
    name: "Approve Break Glass",
    description: "Approve or deny emergency access requests",
    module: "iam",
    parentKey: null,
  },
  {
    key: "org.read",
    name: "Organization Read",
    description: "Read organization entities within tenant scope",
    module: "organizations",
    parentKey: null,
  },
  {
    key: "org.write",
    name: "Organization Write",
    description: "Create or update organizations",
    module: "organizations",
    parentKey: "org.read",
  },
  {
    key: "org.settings",
    name: "Organization Settings",
    description: "Manage organization settings",
    module: "organizations",
    parentKey: "org.write",
  },
  {
    key: "org.lifecycle",
    name: "Organization Lifecycle",
    description: "Suspend, activate, or archive organizations",
    module: "organizations",
    parentKey: "org.write",
  },
  {
    key: "users.read",
    name: "Users Read",
    description: "View users and profiles",
    module: "identity",
    parentKey: null,
  },
  {
    key: "users.manage",
    name: "Users Manage",
    description: "Manage users and profiles",
    module: "identity",
    parentKey: "users.read",
  },
  {
    key: "roles.assign",
    name: "Assign Roles",
    description: "Assign roles to users",
    module: "roles",
    parentKey: null,
  },
  {
    key: "roles.manage",
    name: "Manage Roles",
    description: "Create and mutate custom roles",
    module: "roles",
    parentKey: "roles.assign",
  },
  {
    key: "session.manage",
    name: "Session Manage",
    description: "Revoke and inspect sessions",
    module: "identity",
    parentKey: null,
  },
] as const;

export class PermissionRegistry {
  private readonly byKey = new Map<string, IamPermissionDefinition>();

  constructor(seed: readonly IamPermissionDefinition[] = IAM_CORE_PERMISSIONS) {
    for (const def of seed) {
      this.register(def);
    }
  }

  register(definition: IamPermissionDefinition): void {
    if (this.byKey.has(definition.key)) {
      throw new Error(`Permission already registered: ${definition.key}`);
    }
    this.byKey.set(definition.key, definition);
  }

  /** Idempotent register for additive catalogs. */
  registerIfAbsent(definition: IamPermissionDefinition): void {
    if (!this.byKey.has(definition.key)) {
      this.byKey.set(definition.key, definition);
    }
  }

  get(key: string): IamPermissionDefinition | undefined {
    return this.byKey.get(key);
  }

  has(key: string): boolean {
    return this.byKey.has(key);
  }

  list(): readonly IamPermissionDefinition[] {
    return [...this.byKey.values()];
  }

  keys(): readonly string[] {
    return [...this.byKey.keys()];
  }
}
