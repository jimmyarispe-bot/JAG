/**
 * IAM platform factory — constructor injection for all services.
 */

import { IamAuditEmitter, InMemoryIamAuditSink } from "@/lib/platform/iam/audit";
import { AuthorizationEngine } from "@/lib/platform/iam/authorization";
import { BreakGlassService } from "@/lib/platform/iam/break-glass";
import { DelegationService } from "@/lib/platform/iam/delegation";
import type { AuthenticationPort } from "@/lib/platform/iam/identity";
import { IdentityService } from "@/lib/platform/iam/identity";
import { OrganizationService } from "@/lib/platform/iam/organizations";
import {
  PermissionGroupRegistry,
  PermissionRegistry,
} from "@/lib/platform/iam/permissions";
import { RoleRegistry } from "@/lib/platform/iam/roles";
import { buildIamAuthzSnapshot } from "@/lib/platform/iam/authorization";
import type { IamAuthzSnapshot } from "@/lib/platform/iam/types";

export type CreateIamPlatformOptions = {
  now?: () => Date;
  createId?: (prefix: string) => string;
  authPort?: AuthenticationPort | null;
  auditAllDecisions?: boolean;
};

export type IamPlatform = {
  audit: IamAuditEmitter;
  auditSink: InMemoryIamAuditSink;
  permissions: PermissionRegistry;
  groups: PermissionGroupRegistry;
  roles: RoleRegistry;
  authorization: AuthorizationEngine;
  organizations: OrganizationService;
  identity: IdentityService;
  delegation: DelegationService;
  breakGlass: BreakGlassService;
  /** Build a subject snapshot including active delegation + break-glass overlays. */
  buildSubjectSnapshot: (input: {
    userId: string;
    organizationId?: string | null;
    roleKeys?: readonly string[];
  }) => IamAuthzSnapshot;
  expireTemporaryAuthority: () => { delegations: number; breakGlass: number };
};

export function createIamPlatform(
  options: CreateIamPlatformOptions = {}
): IamPlatform {
  const now = options.now ?? (() => new Date());
  let seq = 0;
  const createId =
    options.createId ?? ((prefix: string) => `${prefix}-${++seq}`);

  const auditSink = new InMemoryIamAuditSink();
  const audit = new IamAuditEmitter({ now, createId, sink: auditSink });
  const permissions = new PermissionRegistry();
  const groups = new PermissionGroupRegistry();
  const roles = new RoleRegistry({ now, createId, permissions, groups });
  const authorization = new AuthorizationEngine({
    now,
    audit,
    auditAllDecisions: options.auditAllDecisions ?? false,
  });
  const organizations = new OrganizationService({
    now,
    createId,
    authorization,
    audit,
  });
  const identity = new IdentityService({
    now,
    createId,
    authorization,
    authPort: options.authPort ?? null,
    audit,
  });
  const delegation = new DelegationService({
    now,
    createId,
    authorization,
    audit,
  });
  const breakGlass = new BreakGlassService({
    now,
    createId,
    authorization,
    audit,
  });

  return {
    audit,
    auditSink,
    permissions,
    groups,
    roles,
    authorization,
    organizations,
    identity,
    delegation,
    breakGlass,
    buildSubjectSnapshot(input) {
      const roleKeys = input.roleKeys ?? roles.rolesForUser(input.userId).map((r) => r.key);
      const basePermissions = roles.permissionsForUser(input.userId);
      const del = delegation.overlayPermissionsForUser(input.userId);
      const bg = breakGlass.overlayPermissionsForUser(input.userId);
      const permissionsSet = new Set(basePermissions);
      for (const key of del.permissions) permissionsSet.add(key);
      for (const key of bg.permissions) permissionsSet.add(key);
      return buildIamAuthzSnapshot({
        userId: input.userId,
        roles: roleKeys,
        permissions: permissionsSet,
        organizationId: input.organizationId ?? null,
        overlayIds: [...del.overlayIds, ...bg.overlayIds],
      });
    },
    expireTemporaryAuthority() {
      return {
        delegations: delegation.expireDue(),
        breakGlass: breakGlass.expireDue(),
      };
    },
  };
}
