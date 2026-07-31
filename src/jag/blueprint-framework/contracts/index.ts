export {
  BLUEPRINT_FRAMEWORK_VERSION,
  type FrameworkIndustryConfigurationKeys,
  type FrameworkValidationIssue,
  type FrameworkValidationResult,
} from "@/jag/blueprint-framework/contracts/types";

export {
  REQUIRED_INDUSTRY_CATALOG_KEYS,
  OPTIONAL_INDUSTRY_CATALOG_KEYS,
  type CatalogEntry,
  type DocumentTypeCatalogEntry,
  type CommunicationTypeCatalogEntry,
  type SchedulingConventionCatalogEntry,
  type WorkClassificationCatalogEntry,
  type DecisionCategoryCatalogEntry,
  type PolicyDefaultCatalogEntry,
  type ReportingDefaultCatalogEntry,
  type AnalyticsDefaultCatalogEntry,
  type IndustryCatalogPayload,
  type RequiredIndustryCatalogKey,
} from "@/jag/blueprint-framework/contracts/catalogs";

export type {
  FoundationCapabilityBinding,
  IndustryBlueprintComposition,
} from "@/jag/blueprint-framework/contracts/composition";

export {
  ORGANIZATION_OVERLAY_ALLOWED,
  ORGANIZATION_OVERLAY_FORBIDDEN,
  type OrganizationOverlayRuleSet,
} from "@/jag/blueprint-framework/contracts/organization-overlay";
