/**
 * Healthcare package — Regional Health System reference organization.
 * Industry vocabulary: Healthcare Industry Blueprint.
 * Shared behavior: foundation Capability Packs (unchanged).
 */

export {
  HEALTHCARE_PACKAGE_ID,
  HEALTHCARE_APPLICATION_ID,
  HEALTHCARE_PACKAGE_VERSION,
  REGIONAL_HEALTH_ORGANIZATION_ID,
  HEALTHCARE_PACKAGE,
} from "@/packages/healthcare/package";

export {
  HEALTHCARE_FOUNDATION_PACK_IDS,
  buildHealthcareFoundationCapabilityPacks,
  healthcareFoundationModules,
} from "@/packages/healthcare/composition";

export {
  describeRegionalHealthOrganization,
  buildRegionalHealthOrganizationBlueprintFromStudio,
} from "@/packages/healthcare/studio";

export {
  buildRegionalHealthOrganizationBlueprint,
  materializeRegionalHealthRuntimeSpecification,
  generateRegionalHealthRuntimeSpecification,
  compileRegionalHealthFromBlueprints,
} from "@/packages/healthcare/blueprints";
