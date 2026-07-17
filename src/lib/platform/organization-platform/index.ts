/**
 * Organization Platform — multi-tenant SaaS foundation.
 *
 * Platform → Organizations → Locations → Departments → Teams → Users → Permissions
 * → Integrations → Executive Command Center → Intelligence (scoped)
 */

export type * from "./types";
export {
  ORGANIZATION_PLATFORM_ROLES,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  permissionsForRole,
  roleHasPermission,
} from "./roles";
export { OrganizationPlatformStore } from "./store";
export {
  TenantIsolationError,
  PermissionDeniedError,
  resolveActor,
  assertPermission,
  assertSameOrganization,
  assertLocationInScope,
  assertDepartmentInScope,
  buildIntelligenceScope,
  actorPermissions,
  scopeToOrganization,
  type ActorContext,
} from "./rbac";
export {
  createOrganizationPlatform,
  getOrganizationPlatform,
  resetOrganizationPlatformForTests,
  type OrganizationPlatform,
  type CreateOrganizationPlatformOptions,
} from "./create-platform";
export { seedDemoOrganizations } from "./seed";
export {
  resolveExecutiveTenantContext,
  toIntegrationScope,
  requireExecAccess,
} from "./context/executive-context";
export { resolveExecutiveContextForIdentity } from "./context/identity-bridge";
export { OrgIntegrationBridge } from "./integrations/org-connector-bridge";
export { OrganizationService, LocationService, UnitService } from "./services/hierarchy";
export { UserService, AuthService, SessionService } from "./services/users-auth";
export {
  SettingsService,
  SecretsService,
  ApiCredentialService,
} from "./services/settings-secrets";
