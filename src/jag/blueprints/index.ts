/**
 * JAG Blueprint Engine — public API.
 */

export type {
  ApplicationSpecification,
  BlueprintContributionBundle,
  CapabilityPack,
  CapabilityPackCompatibility,
  CapabilityPackDependency,
  CapabilityPackDeprecation,
  CapabilityPackDiscoveryMeta,
  CapabilityPackLicense,
  CapabilityPackStatus,
  CapabilityPackUpgradePath,
  IndustryBlueprint,
  IndustryId,
  IndustryStudioProfile,
  MaterializeBlueprintsInput,
  MaterializeBlueprintsResult,
  OrganizationBlueprint,
  RuntimeSpecification,
} from "@/jag/blueprints/contracts";

export {
  materializeBlueprints,
  compileFromBlueprints,
  type CompileFromBlueprintsOptions,
  type CompileFromBlueprintsResult,
} from "@/jag/blueprints/materialize";

export {
  validateBlueprintPair,
  validateIndustryBlueprint,
  validateOrganizationBlueprint,
  type BlueprintValidationIssue,
  type BlueprintValidationResult,
} from "@/jag/blueprints/validation";

export {
  EducationIndustryBlueprint,
  EDUCATION_INDUSTRY_ID,
  EDUCATION_INDUSTRY_ENTITIES,
  EDUCATION_STUDIO_PROFILE,
  EDUCATION_FOUNDATION_MODULES,
  EDUCATION_VERTICAL_MODULES,
  EDUCATION_BLUEPRINT_COMPOSITION,
  educationIndustryCatalogPayload,
  HealthcareIndustryBlueprint,
  HEALTHCARE_INDUSTRY_ID,
  HEALTHCARE_INDUSTRY_ENTITIES,
  HEALTHCARE_STUDIO_PROFILE,
  HEALTHCARE_FOUNDATION_MODULES,
  HEALTHCARE_VERTICAL_MODULES,
  HEALTHCARE_BLUEPRINT_COMPOSITION,
  healthcareIndustryCatalogPayload,
  ManufacturingIndustryBlueprint,
  MANUFACTURING_INDUSTRY_ID,
  MANUFACTURING_INDUSTRY_ENTITIES,
  MANUFACTURING_STUDIO_PROFILE,
  MANUFACTURING_FOUNDATION_MODULES,
  MANUFACTURING_VERTICAL_MODULES,
  MANUFACTURING_BLUEPRINT_COMPOSITION,
  manufacturingIndustryCatalogPayload,
  GovernmentIndustryBlueprint,
  GOVERNMENT_INDUSTRY_ID,
  GOVERNMENT_INDUSTRY_ENTITIES,
  GOVERNMENT_STUDIO_PROFILE,
  GOVERNMENT_FOUNDATION_MODULES,
  GOVERNMENT_VERTICAL_MODULES,
  GOVERNMENT_BLUEPRINT_COMPOSITION,
  governmentIndustryCatalogPayload,
  INDUSTRY_BLUEPRINTS,
  getIndustryBlueprint,
  listIndustryBlueprints,
  requireIndustryBlueprint,
} from "@/jag/blueprints/industries";

export { runtimeSpecificationIds } from "@/jag/blueprints/testing";
