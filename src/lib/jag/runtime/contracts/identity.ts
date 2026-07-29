/**
 * Framework-agnostic identity contract for the Runtime Kernel.
 * No education-specific fields — packs use `attributes`.
 */

export interface RuntimeIdentity {
  /** Auth subject. */
  principalId: string;
  /** Effective user after impersonation/delegation. */
  effectiveUserId: string;
  displayName?: string;
  email?: string;
  /** Grant source only — authorize via permission keys. */
  roles: readonly string[];
  /** Effective permission keys. */
  permissions: readonly string[];
  orgAssignments: readonly RuntimeOrgAssignment[];
  activeOrganizationId: string;
  impersonation?: RuntimeImpersonation;
  delegation?: RuntimeDelegation;
  preferences?: Readonly<Record<string, unknown>>;
  /** Pack-scoped attributes (e.g. school scope) without Core coupling. */
  attributes?: Readonly<Record<string, unknown>>;
  issuedAt: string;
  expiresAt?: string;
}

export interface RuntimeOrgAssignment {
  organizationId: string;
  /** Optional labels for UI; not used for authorization. */
  label?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface RuntimeImpersonation {
  actorUserId: string;
  targetUserId: string;
  sessionId: string;
}

export interface RuntimeDelegation {
  fromUserId: string;
  scope: readonly string[];
  expiresAt: string;
}
