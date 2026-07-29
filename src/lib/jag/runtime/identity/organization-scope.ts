import type { RuntimeOrgAssignment } from "../contracts/identity";
import type { OrganizationResolver } from "./identity-types";

/**
 * Universal organization membership / active-org resolution.
 * No industry-specific tenancy fields.
 */
export class DefaultOrganizationResolver implements OrganizationResolver {
  membershipIds(
    assignments: readonly RuntimeOrgAssignment[]
  ): readonly string[] {
    return assignments.map((a) => a.organizationId);
  }

  resolveActiveOrganization(
    assignments: readonly RuntimeOrgAssignment[],
    preferredOrganizationId?: string
  ): string | null {
    if (assignments.length === 0) return null;
    if (
      preferredOrganizationId &&
      this.assertMembership(assignments, preferredOrganizationId)
    ) {
      return preferredOrganizationId;
    }
    return assignments[0]!.organizationId;
  }

  assertMembership(
    assignments: readonly RuntimeOrgAssignment[],
    organizationId: string
  ): boolean {
    return assignments.some((a) => a.organizationId === organizationId);
  }
}

export function createOrganizationResolver(): OrganizationResolver {
  return new DefaultOrganizationResolver();
}
