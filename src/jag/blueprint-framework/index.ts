/**
 * Blueprint Framework v1 — constitutional authoring standard.
 *
 * Documentation, contracts, naming conventions, and validation helpers only.
 * No runtime behavior. No Platform engine modifications.
 */

export {
  BLUEPRINT_FRAMEWORK_VERSION,
  REQUIRED_INDUSTRY_CATALOG_KEYS,
  OPTIONAL_INDUSTRY_CATALOG_KEYS,
  ORGANIZATION_OVERLAY_ALLOWED,
  ORGANIZATION_OVERLAY_FORBIDDEN,
  type FrameworkIndustryConfigurationKeys,
  type FrameworkValidationIssue,
  type FrameworkValidationResult,
  type CatalogEntry,
  type IndustryCatalogPayload,
  type IndustryBlueprintComposition,
  type FoundationCapabilityBinding,
  type RequiredIndustryCatalogKey,
  type OrganizationOverlayRuleSet,
} from "@/jag/blueprint-framework/contracts";

export {
  BLUEPRINT_FOUNDATION_MODULES,
  BLUEPRINT_FOUNDATION_CAPABILITY_MAP,
  BLUEPRINT_FOUNDATION_PACK_ID_RESOLUTION,
  BLUEPRINT_NAMING_TERMS,
  BLUEPRINT_NAMING_PATTERNS,
  FORBIDDEN_INDUSTRY_PACK_ID_SUFFIXES,
  FORBIDDEN_INDUSTRY_PACK_IDS,
  FORBIDDEN_INDUSTRY_IMPLEMENTATION_MARKERS,
  type BlueprintFoundationModule,
} from "@/jag/blueprint-framework/conventions";

export {
  validateIndustryAgainstBlueprintFramework,
  validateOrganizationAgainstBlueprintFramework,
} from "@/jag/blueprint-framework/validation";

export { BLUEPRINT_FRAMEWORK_STANDARD } from "@/jag/blueprint-framework/standard";
