/**
 * Sprint 213 — Organization administration & tenant management.
 * Import via `@/lib/platform/tenant` or `…/tenant/index`.
 */

export type {
  OrganizationStatus,
  TenantContact,
  OrganizationProfile,
  SubscriptionStatus,
  BillingProviderId,
  TenantSubscription,
  TenantFeatureFlagId,
  TenantFeatureFlags,
  TenantUsageMetrics,
  TenantCapabilityView,
  SubdomainAvailability,
  TenantRecord,
  OrganizationAdminAuditKind,
  OrganizationAdminAuditEvent,
  OrganizationObservabilityKind,
  OrganizationObservation,
  OrganizationConfigExport,
} from "./types";

export { RESERVED_SUBDOMAINS, isReservedSubdomain } from "./reserved-subdomains";
export { DEFAULT_FEATURE_FLAGS, createTenantRecord } from "./defaults";
export { TenantRegistry } from "./TenantRegistry";
export { TenantService } from "./TenantService";
export {
  OrganizationService,
  type OrganizationProfilePatch,
} from "./OrganizationService";
export { OrganizationSettingsService } from "./OrganizationSettingsService";
export { SubscriptionService } from "./SubscriptionService";
export { FeatureFlagService } from "./FeatureFlagService";
export { UsageService } from "./UsageService";
export {
  recordOrganizationObservation,
  recordOrganizationAdminAudit,
  listOrganizationObservations,
  listOrganizationAdminAudit,
  clearOrganizationObservabilityForTests,
} from "./OrganizationObservability";
