import type { OrganizationPlatformStore } from "./store";
import { permissionsForRole, roleHasPermission } from "./roles";
import type {
  MembershipRecord,
  OrganizationPlatformRole,
  TenantPermission,
  TenantScope,
} from "./types";

export class TenantIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantIsolationError";
  }
}

export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

export type ActorContext = {
  userId: string;
  organizationId: string;
  role: OrganizationPlatformRole;
  membership: MembershipRecord;
  locationId?: string | null;
  departmentId?: string | null;
};

export function resolveActor(
  store: OrganizationPlatformStore,
  userId: string,
  organizationId: string
): ActorContext {
  const membership = [...store.memberships.values()].find(
    (m) =>
      m.userId === userId &&
      m.organizationId === organizationId &&
      m.status === "active"
  );
  if (!membership) {
    throw new TenantIsolationError(
      `User ${userId} has no active membership in organization ${organizationId}`
    );
  }
  return {
    userId,
    organizationId,
    role: membership.role,
    membership,
    locationId: membership.locationIds[0] ?? null,
    departmentId: membership.departmentIds[0] ?? null,
  };
}

export function assertPermission(actor: ActorContext, permission: TenantPermission): void {
  if (!roleHasPermission(actor.role, permission)) {
    throw new PermissionDeniedError(
      `Role ${actor.role} lacks permission ${permission} in org ${actor.organizationId}`
    );
  }
}

export function assertSameOrganization(
  resourceOrganizationId: string,
  actorOrganizationId: string,
  resourceLabel = "resource"
): void {
  if (resourceOrganizationId !== actorOrganizationId) {
    throw new TenantIsolationError(
      `Cross-organization access denied: ${resourceLabel} belongs to ${resourceOrganizationId}, actor is ${actorOrganizationId}`
    );
  }
}

export function assertLocationInScope(
  actor: ActorContext,
  locationId: string | null | undefined
): void {
  if (!locationId) return;
  if (actor.membership.locationIds.length === 0) return;
  if (!actor.membership.locationIds.includes(locationId)) {
    throw new TenantIsolationError(
      `Location ${locationId} is outside membership scope for user ${actor.userId}`
    );
  }
}

export function assertDepartmentInScope(
  actor: ActorContext,
  departmentId: string | null | undefined
): void {
  if (!departmentId) return;
  if (actor.membership.departmentIds.length === 0) return;
  if (!actor.membership.departmentIds.includes(departmentId)) {
    throw new TenantIsolationError(
      `Department ${departmentId} is outside membership scope for user ${actor.userId}`
    );
  }
}

/** Build intelligence / query scope from actor — never crosses org boundary. */
export function buildIntelligenceScope(actor: ActorContext): TenantScope {
  return {
    organizationId: actor.organizationId,
    locationId: actor.locationId ?? actor.membership.locationIds[0] ?? null,
    departmentId: actor.departmentId ?? actor.membership.departmentIds[0] ?? null,
    teamId: actor.membership.teamIds[0] ?? null,
  };
}

export function actorPermissions(actor: ActorContext): TenantPermission[] {
  return permissionsForRole(actor.role);
}

/** Filter any list so only rows for the actor's organization remain. */
export function scopeToOrganization<T extends { organizationId: string }>(
  rows: T[],
  organizationId: string
): T[] {
  return rows.filter((r) => r.organizationId === organizationId);
}
