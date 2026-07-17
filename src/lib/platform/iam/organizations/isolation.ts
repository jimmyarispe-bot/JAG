export class TenantIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantIsolationError";
  }
}

/**
 * Assert that a resource belongs to the actor's organization.
 * Cross-tenant access is denied unless an explicit overlay path is used upstream.
 */
export function assertSameOrganization(
  resourceOrganizationId: string,
  actorOrganizationId: string | null,
  resourceLabel = "resource"
): void {
  if (!actorOrganizationId || resourceOrganizationId !== actorOrganizationId) {
    throw new TenantIsolationError(
      `Cross-organization access denied: ${resourceLabel} belongs to ${resourceOrganizationId}, actor is ${actorOrganizationId ?? "none"}`
    );
  }
}

export function assertOrganizationActive(
  status: string,
  organizationId: string
): void {
  if (status !== "active") {
    throw new TenantIsolationError(
      `Organization ${organizationId} is not active (status=${status})`
    );
  }
}
