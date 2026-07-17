/**
 * Organization Platform — multi-tenant domain types.
 * Shared intelligence engine; isolated tenant data / users / integrations / branding.
 */

export type OrganizationPlatformRole =
  | "platform_admin"
  | "founder"
  | "organization_owner"
  | "ceo"
  | "executive"
  | "board_member"
  | "department_leader"
  | "manager"
  | "employee"
  | "advisor"
  | "guest";

export type AuthMethod =
  | "email_password"
  | "magic_link"
  | "google"
  | "microsoft"
  | "sso_future";

export type LocationKind = "location" | "school" | "campus" | "business_unit";

export type UnitKind = "department" | "team" | "division" | "cost_center" | "program";

export type TenantPermission =
  | "platform.admin"
  | "org.read"
  | "org.write"
  | "org.settings"
  | "org.branding"
  | "org.delete"
  | "users.read"
  | "users.invite"
  | "users.manage"
  | "users.deactivate"
  | "roles.assign"
  | "locations.manage"
  | "departments.manage"
  | "teams.manage"
  | "integrations.read"
  | "integrations.manage"
  | "exec.access"
  | "intelligence.query"
  | "audit.read"
  | "secrets.manage";

export type TenantScope = {
  organizationId: string;
  locationId?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
};

export type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "provisioning";
  industry: string;
  createdAt: string;
  updatedAt: string;
  ownerUserId: string | null;
};

export type LocationRecord = {
  id: string;
  organizationId: string;
  kind: LocationKind;
  name: string;
  code?: string;
  parentLocationId?: string | null;
  timezone?: string;
  createdAt: string;
};

export type UnitRecord = {
  id: string;
  organizationId: string;
  locationId?: string | null;
  kind: UnitKind;
  name: string;
  code?: string;
  parentUnitId?: string | null;
  createdAt: string;
};

export type OrganizationSettings = {
  organizationId: string;
  companyProfile: {
    legalName: string;
    website?: string;
    description?: string;
  };
  branding: {
    logoUrl?: string | null;
    primaryColor: string;
    accentColor: string;
    productName: string;
  };
  timezone: string;
  currency: string;
  fiscalYearStartMonth: number;
  industry: string;
  language: string;
  region: string;
  updatedAt: string;
};

export type PlatformUser = {
  id: string;
  email: string;
  fullName: string;
  status: "invited" | "active" | "deactivated";
  authMethods: AuthMethod[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
};

export type MembershipRecord = {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationPlatformRole;
  locationIds: string[];
  departmentIds: string[];
  teamIds: string[];
  status: "active" | "invited" | "deactivated";
  invitedAt?: string;
  joinedAt?: string | null;
};

export type SessionRecord = {
  id: string;
  userId: string;
  activeOrganizationId: string | null;
  activeLocationId: string | null;
  authMethod: AuthMethod;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string | null;
};

export type OrganizationSecret = {
  id: string;
  organizationId: string;
  key: string;
  /** Never expose raw value in UI — only presence. */
  fingerprint: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationApiCredential = {
  id: string;
  organizationId: string;
  name: string;
  prefix: string;
  fingerprint: string;
  createdAt: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
};

export type OrgAuditEntry = {
  id: string;
  organizationId: string | null;
  actorUserId: string | null;
  action: string;
  detail: Record<string, unknown>;
  createdAt: string;
};

export type ExecutiveTenantContext = {
  organizationId: string;
  organizationName: string;
  locationId: string | null;
  locationName: string | null;
  role: OrganizationPlatformRole | null;
  permissions: TenantPermission[];
  integrationInstanceIds: string[];
  intelligenceScope: TenantScope;
  branding: OrganizationSettings["branding"];
  timezone: string;
  currency: string;
};
