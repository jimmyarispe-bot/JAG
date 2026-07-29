import type {
  RuntimeDelegation,
  RuntimeIdentity,
  RuntimeImpersonation,
  RuntimeOrgAssignment,
} from "../contracts/identity";

/**
 * Request supplied by the host (auth already done elsewhere).
 * Identity Runtime does not authenticate — it resolves authority.
 */
export interface IdentityResolutionRequest {
  /** Opaque host session reference — interpreted only by IdentityProviders. */
  sessionRef?: string;
  /** When known, preferred principal id hint. */
  principalId?: string;
  /** Preferred active organization; validated against memberships. */
  activeOrganizationId?: string;
  /** Apply an explicit delegation / impersonation contract by id. */
  delegationId?: string;
  /** Free-form host attributes (headers, device flags, etc.). */
  attributes?: Readonly<Record<string, unknown>>;
  correlationId?: string;
  sessionId?: string;
  /** Injected clock for tests (ISO). */
  now?: string;
}

/** Principal facts loaded by an IdentityProvider — not an auth token. */
export interface PrincipalRecord {
  principalId: string;
  displayName?: string;
  email?: string;
  roles: readonly string[];
  /** Direct permission grants (before role catalog union / delegation mask). */
  permissions: readonly string[];
  orgAssignments: readonly RuntimeOrgAssignment[];
  preferences?: Readonly<Record<string, unknown>>;
  attributes?: Readonly<Record<string, unknown>>;
  /** Optional role → permission catalog contribution. */
  rolePermissionCatalog?: Readonly<Record<string, readonly string[]>>;
  expiresAt?: string;
}

/** Organization / tenancy scope after resolution. */
export interface IdentityScope {
  organizationIds: readonly string[];
  activeOrganizationId: string;
  attributes?: Readonly<Record<string, unknown>>;
}

/** Fully resolved identity ready for downstream Runtime stages. */
export interface ResolvedIdentity {
  identity: RuntimeIdentity;
  scope: IdentityScope;
  providerId: string;
  cacheKey: string;
  resolvedAt: string;
}

export type IdentityResolutionOutcome =
  | { status: "resolved"; value: ResolvedIdentity }
  | { status: "unauthenticated"; reason: string };

export type DelegationKind = "delegation" | "impersonation" | "break_glass";

/**
 * Explicit authority contract. Impersonation is allowed only via this shape.
 */
export interface DelegationContract {
  id: string;
  fromUserId: string;
  /** User receiving delegated authority (or steward actor for impersonation). */
  toUserId: string;
  /** For impersonation: user being acted as. */
  targetUserId?: string;
  kind: DelegationKind;
  /** Permission keys granted / mask applied. */
  scope: readonly string[];
  /** Optional org constraint; empty/undefined = actor's memberships. */
  organizationIds?: readonly string[];
  expiresAt: string;
  reason: string;
  grantedAt: string;
  revokedAt?: string;
}

export interface PermissionResolutionInput {
  roles: readonly string[];
  basePermissions: readonly string[];
  rolePermissionCatalog?: Readonly<Record<string, readonly string[]>>;
  delegation?: Pick<RuntimeDelegation, "scope"> | null;
  breakGlassPermissions?: readonly string[];
  organizationId: string;
}

export interface IdentityResolver {
  resolve(
    request: IdentityResolutionRequest
  ): Promise<IdentityResolutionOutcome>;
}

export interface PermissionResolver {
  resolve(input: PermissionResolutionInput): readonly string[];
  authorize(permissions: readonly string[], permission: string): boolean;
}

export interface OrganizationResolver {
  membershipIds(assignments: readonly RuntimeOrgAssignment[]): readonly string[];
  resolveActiveOrganization(
    assignments: readonly RuntimeOrgAssignment[],
    preferredOrganizationId?: string
  ): string | null;
  assertMembership(
    assignments: readonly RuntimeOrgAssignment[],
    organizationId: string
  ): boolean;
}

export interface DelegationResolver {
  get(id: string): Promise<DelegationContract | null> | DelegationContract | null;
  grant(
    contract: Omit<DelegationContract, "grantedAt" | "revokedAt"> & {
      grantedAt?: string;
    }
  ): Promise<DelegationContract> | DelegationContract;
  revoke(
    id: string,
    reason?: string
  ): Promise<DelegationContract | null> | DelegationContract | null;
  listActiveForUser(
    userId: string,
    nowIso: string
  ): Promise<readonly DelegationContract[]> | readonly DelegationContract[];
}

export type {
  RuntimeDelegation,
  RuntimeIdentity,
  RuntimeImpersonation,
  RuntimeOrgAssignment,
};
