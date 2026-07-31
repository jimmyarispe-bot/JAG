/**
 * Government package — City Government reference organization.
 * Industry vocabulary: Government Industry Blueprint.
 * Shared behavior: foundation Capability Packs (unchanged).
 */

export {
  GOVERNMENT_PACKAGE_ID,
  GOVERNMENT_APPLICATION_ID,
  GOVERNMENT_PACKAGE_VERSION,
  CITY_GOVERNMENT_ORGANIZATION_ID,
  GOVERNMENT_PACKAGE,
} from "@/packages/government/package";

export {
  GOVERNMENT_FOUNDATION_PACK_IDS,
  buildGovernmentFoundationCapabilityPacks,
  governmentFoundationModules,
} from "@/packages/government/composition";

export {
  describeCityGovernmentOrganization,
  buildCityGovernmentOrganizationBlueprintFromStudio,
} from "@/packages/government/studio";

export {
  buildCityGovernmentOrganizationBlueprint,
  materializeCityGovernmentRuntimeSpecification,
  generateCityGovernmentRuntimeSpecification,
  compileCityGovernmentFromBlueprints,
} from "@/packages/government/blueprints";
