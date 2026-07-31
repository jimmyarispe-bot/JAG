export { OrganizationService } from "@/lib/platform/organizations/service";
export type { OrganizationServiceApi } from "@/lib/platform/organizations/service";

export {
  PLATFORM_SEED_ORGANIZATION_SLUG,
} from "@/lib/platform/organizations/types";
export type {
  OrganizationApplicationInfo,
  OrganizationContext,
  OrganizationDomains,
  OrganizationFeatureFlags,
  OrganizationFeatureKey,
  OrganizationIdentity,
  OrganizationPolicies,
  OrganizationSettings,
  OrganizationSettingsJson,
  OrganizationSupportInfo,
  ResolveOrganizationInput,
} from "@/lib/platform/organizations/types";

export {
  ORGANIZATION_FEATURE_CATALOG,
  organizationHasFeature,
  resolveOrganizationFeatures,
} from "@/lib/platform/organizations/features";

export {
  extractDomainsFromSettings,
  hostMatchesOrganization,
  normalizeHost,
  parseOrganizationDomainMap,
  resolveSlugFromHostMap,
} from "@/lib/platform/organizations/domains";

export {
  resolveOrganizationPolicies,
  resolveOrganizationSettings,
  resolveSupportInfo,
} from "@/lib/platform/organizations/settings";

export {
  resolveContextBranding,
  resolveContextEmailBrand,
} from "@/lib/platform/organizations/branding";

export {
  resolveOrganizationContext,
  resolveOrganizationRecord,
} from "@/lib/platform/organizations/resolver";
