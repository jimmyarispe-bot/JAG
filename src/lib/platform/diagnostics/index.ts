export {
  collectRegistryAuditReport,
  type ProfileKindDiagnostics,
  type RegistryAuditReport,
} from "@/lib/platform/diagnostics/registry-audit";
export {
  validatePlatformRegistry,
  type PlatformRegistryValidationIssue,
  type PlatformRegistryValidationResult,
} from "@/lib/platform/diagnostics/validate-registry";
export {
  getStaticPlatformServiceHealth,
  probePlatformServiceTables,
  type PlatformServiceHealthCheck,
} from "@/lib/platform/diagnostics/service-health";
