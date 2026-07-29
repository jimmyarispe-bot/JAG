/** Typed Identity Runtime event channels. */

export const IDENTITY_EVENT_TYPES = {
  IDENTITY_RESOLVED: "jag.runtime.identity.resolved",
  ORGANIZATION_CHANGED: "jag.runtime.identity.organization_changed",
  DELEGATION_GRANTED: "jag.runtime.identity.delegation_granted",
  DELEGATION_REVOKED: "jag.runtime.identity.delegation_revoked",
  PERMISSION_RESOLVED: "jag.runtime.identity.permission_resolved",
  IDENTITY_RESOLUTION_FAILED: "jag.runtime.identity.resolution_failed",
} as const;

export type IdentityEventType =
  (typeof IDENTITY_EVENT_TYPES)[keyof typeof IDENTITY_EVENT_TYPES];

export interface IdentityResolvedPayload {
  principalId: string;
  effectiveUserId: string;
  activeOrganizationId: string;
  providerId: string;
  permissionCount: number;
  delegationId?: string;
}

export interface OrganizationChangedPayload {
  principalId: string;
  fromOrganizationId: string | null;
  toOrganizationId: string;
}

export interface DelegationGrantedPayload {
  delegationId: string;
  kind: string;
  fromUserId: string;
  toUserId: string;
  targetUserId?: string;
  expiresAt: string;
}

export interface DelegationRevokedPayload {
  delegationId: string;
  reason?: string;
}

export interface PermissionResolvedPayload {
  effectiveUserId: string;
  organizationId: string;
  permissions: readonly string[];
}

export interface IdentityResolutionFailedPayload {
  reason: string;
  code: string;
  principalId?: string;
}
