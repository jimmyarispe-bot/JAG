/**
 * Manufacturing package — Advanced Manufacturing Company reference organization.
 * Industry vocabulary: Manufacturing Industry Blueprint.
 * Shared behavior: foundation Capability Packs (unchanged).
 */

export {
  MANUFACTURING_PACKAGE_ID,
  MANUFACTURING_APPLICATION_ID,
  MANUFACTURING_PACKAGE_VERSION,
  ADVANCED_MANUFACTURING_ORGANIZATION_ID,
  MANUFACTURING_PACKAGE,
} from "@/packages/manufacturing/package";

export {
  MANUFACTURING_FOUNDATION_PACK_IDS,
  buildManufacturingFoundationCapabilityPacks,
  manufacturingFoundationModules,
} from "@/packages/manufacturing/composition";

export {
  describeAdvancedManufacturingOrganization,
  buildAdvancedManufacturingOrganizationBlueprintFromStudio,
} from "@/packages/manufacturing/studio";

export {
  buildAdvancedManufacturingOrganizationBlueprint,
  materializeAdvancedManufacturingRuntimeSpecification,
  generateAdvancedManufacturingRuntimeSpecification,
  compileAdvancedManufacturingFromBlueprints,
} from "@/packages/manufacturing/blueprints";
