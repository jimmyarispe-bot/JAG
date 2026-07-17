/**
 * Sprint 014 — Identity & Access (IAM) shared types.
 * Platform infrastructure only — no product-specific surfaces.
 */

/** Organization lifecycle states. */
export const ORGANIZATION_LIFECYCLE_STATUSES = [
  "draft",
  "active",
  "suspended",
  "archived",
] as const;

export type OrganizationLifecycleStatus =
  (typeof ORGANIZATION_LIFECYCLE_STATUSES)[number];

export type IamOrganizationSettings = {
  timezone: string;
  locale: string;
  currency: string;
  branding: {
    displayName: string | null;
    primaryColor: string | null;
    logoUrl: string | null;
  };
  featureFlags: Readonly<Record<string, boolean>>;
};

export type IamOrganization = {
  id: string;
  slug: string;
  name: string;
  status: OrganizationLifecycleStatus;
  ownerUserId: string | null;
  settings: IamOrganizationSettings;
  createdAt: string;
  updatedAt: string;
};

export type IamUser = {
  id: string;
  email: string;
  status: "active" | "disabled" | "invited";
  createdAt: string;
  updatedAt: string;
};

export type IamProfile = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  title: string | null;
  metadata: Readonly<Record<string, string>>;
  updatedAt: string;
};

export type IamSession = {
  id: string;
  userId: string;
  organizationId: string | null;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  /** Active overlay ids applied to this session. */
  overlayIds: readonly string[];
};

export type IamRoleKind = "system" | "organization" | "custom";

export type IamRole = {
  id: string;
  key: string;
  displayName: string;
  kind: IamRoleKind;
  /** Organization-scoped roles bind to a tenant; system roles use null. */
  organizationId: string | null;
  parentRoleId: string | null;
  permissionGroupIds: readonly string[];
  /** System roles cannot have permission toggles mutated in admin UIs. */
  immutable: boolean;
  createdAt: string;
};

export type IamPermissionDefinition = {
  key: string;
  name: string;
  description: string;
  module: string;
  /** Parent permission for inheritance (optional). */
  parentKey: string | null;
};

export type IamPermissionGroup = {
  id: string;
  key: string;
  name: string;
  permissionKeys: readonly string[];
};

/** Immutable authorization view — decisions use permissions only. */
export type IamAuthzSnapshot = {
  userId: string;
  /** Identity metadata only — never used as an authorization gate. */
  roles: readonly string[];
  permissions: ReadonlySet<string>;
  organizationId: string | null;
  overlayIds: readonly string[];
};

export type IamAuthzSubject =
  | IamAuthzSnapshot
  | {
      permissions: readonly string[] | ReadonlySet<string>;
      roles?: readonly string[];
      userId?: string;
      id?: string;
      organizationId?: string | null;
      overlayIds?: readonly string[];
    };

export type AuthorizationDecision = {
  allowed: boolean;
  permission: string;
  userId: string;
  organizationId: string | null;
  overlayIds: readonly string[];
  at: string;
};

export type IamAuditEventKind =
  | "authorization.allow"
  | "authorization.deny"
  | "delegation.granted"
  | "delegation.revoked"
  | "delegation.expired"
  | "delegation.used"
  | "break_glass.requested"
  | "break_glass.approved"
  | "break_glass.denied"
  | "break_glass.activated"
  | "break_glass.expired"
  | "break_glass.revoked"
  | "break_glass.action"
  | "organization.lifecycle"
  | "session.revoked";

export type IamAuditEvent = {
  id: string;
  kind: IamAuditEventKind;
  actorUserId: string | null;
  subjectUserId: string | null;
  organizationId: string | null;
  permission: string | null;
  detail: Readonly<Record<string, unknown>>;
  at: string;
  /** Break-glass / security streams are append-only. */
  immutable: boolean;
};

export type IamDelegationStatus = "active" | "revoked" | "expired";

export type IamDelegation = {
  id: string;
  grantorUserId: string;
  granteeUserId: string;
  organizationId: string | null;
  permissionKeys: readonly string[];
  reason: string;
  startsAt: string;
  expiresAt: string;
  revokedAt: string | null;
  status: IamDelegationStatus;
};

export type BreakGlassStatus =
  | "pending_approval"
  | "approved"
  | "denied"
  | "active"
  | "expired"
  | "revoked";

export type IamBreakGlassSession = {
  id: string;
  requesterUserId: string;
  approverUserId: string | null;
  organizationId: string;
  permissionKeys: readonly string[];
  reason: string;
  ticketRef: string | null;
  status: BreakGlassStatus;
  requestedAt: string;
  approvedAt: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
};
