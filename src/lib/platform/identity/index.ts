/**
 * Platform identity — organizations + permission engine surface.
 *
 * Sprint 014 product-agnostic IAM foundation lives at `@/lib/platform/iam`.
 * This module remains the application-facing adapter (catalog, guards, orgs).
 */

export {
  authorize,
  authorizeAny,
  authorizeAll,
  authorizeCatalog,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  buildAuthzSnapshot,
  toAuthzSnapshot,
  type AuthzSnapshot,
  type AuthzSubject,
} from "@/lib/platform/identity/authorization-service";

export {
  PERMISSION_CATALOG,
  PERMISSION_CATALOG_DEFINITIONS,
  CATALOG_PERMISSION_ALIASES,
  isCatalogPermission,
  resolveCatalogPermission,
  getCatalogPermission,
  catalogPermissionIds,
  type CatalogPermission,
  type CatalogPermissionDefinition,
} from "@/lib/platform/identity/permission-catalog";

export {
  OFFICIAL_PLATFORM_ROLES,
  OFFICIAL_PLATFORM_ROLE_DEFINITIONS,
  isOfficialPlatformRole,
  getOfficialPlatformRole,
  officialPlatformRoleIds,
  officialPlatformRoleDefinitions,
  normalizePlatformRoles,
  officialRolesFrom,
  legacyRolesFrom,
  type OfficialPlatformRole,
  type PlatformRoleDefinition,
} from "@/lib/platform/identity/platform-roles";

export {
  JAG_ENTRY_PERMISSION,
  ACADEMYOS_HOME_PATH,
  canEnterJag,
  authorizeJagEntry,
  evaluateJagProtection,
} from "@/lib/platform/identity/founder-protection";

export {
  FINANCE_ENTRY_PERMISSION,
  FINANCE_DENIED_REDIRECT,
  isFinancialSecurityRoute,
  canAccessFinance,
  authorizeFinanceEntry,
  evaluateFinancialSecurity,
} from "@/lib/platform/identity/financial-security";

export {
  ORGANIZATION_TYPES,
  ORGANIZATION_STATUSES,
  ORGANIZATION_SUBSCRIPTION_STATUSES,
  listOrganizations,
  getOrganizationById,
  getOrganizationBySlug,
  getOrganizationDetail,
  getOrganizationUsers,
  getOrganizationSchools,
  getOrganizationPermissions,
  assertOrganizationAccess,
  createOrganization,
  type OrganizationType,
  type OrganizationStatus,
  type OrganizationSubscriptionStatus,
  type OrganizationBranding,
  type OrganizationEntity,
  type OrganizationDetail,
  type OrganizationUserSummary,
  type OrganizationSchoolSummary,
  type CreateOrganizationInput,
} from "@/lib/platform/identity/organizations";

export {
  MEMBERSHIP_ROLES,
  MEMBERSHIP_STATUSES,
  listUserOrganizationMemberships,
  getPrimaryOrganizationMembership,
  getAccessibleOrganizationsForUser,
  userBelongsToOrganization,
  resolvePrimaryOrganizationId,
  type MembershipRole,
  type MembershipStatus,
  type OrgMembership,
} from "@/lib/platform/identity/org-membership";

export {
  needsAuthUserProvisioning,
  ensureCurrentAuthUserProvisioned,
  loadAuthProvisionState,
  type AuthProvisionState,
} from "@/lib/platform/identity/provision-auth-user";

export {
  getRequestWorkspaceContext,
  type RequestWorkspaceContext,
} from "@/lib/platform/identity/request-context";

/** Platform IAM foundation (delegation, break glass, generic authz engine). */
export {
  createIamPlatform,
  type IamPlatform,
  type CreateIamPlatformOptions,
} from "@/lib/platform/iam";
