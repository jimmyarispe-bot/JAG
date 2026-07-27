/** Application registry & tenant enablement (Sprint 059 — metadata foundation). */

export type {
  OrganizationApplicationEnablement,
  OrganizationApplicationStatus,
  PlatformApplication,
  PlatformApplicationKey,
  PlatformApplicationStatus,
  TenantApplicationSnapshot,
} from "@/lib/platform/applications/types";

export {
  ACADEMYOS_APPLICATION_KEY,
  DEFAULT_APPLICATION_KEY,
  PLATFORM_APPLICATION_CATALOG,
  PLATFORM_NAME,
  TENANT_ONE_SLUG,
  getCatalogApplication,
} from "@/lib/platform/applications/catalog";

export {
  buildTenantApplicationSnapshot,
  isApplicationEnabled,
  resolveEnabledApplicationKeys,
} from "@/lib/platform/applications/resolve";

export {
  getTenantApplicationSnapshot,
  listOrganizationApplications,
  listPlatformApplications,
} from "@/lib/platform/applications/queries";
