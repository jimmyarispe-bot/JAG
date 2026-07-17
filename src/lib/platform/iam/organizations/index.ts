export {
  OrganizationService,
  type OrganizationServiceDependencies,
} from "@/lib/platform/iam/organizations/service";
export {
  TenantIsolationError,
  assertSameOrganization,
  assertOrganizationActive,
} from "@/lib/platform/iam/organizations/isolation";
