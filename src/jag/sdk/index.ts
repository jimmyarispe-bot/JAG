/**
 * JAG SDK v1 — supported extension surface for third-party developers.
 *
 * Build industry / organization blueprints and capability packs without
 * reading Platform internals. Validation wraps Blueprint Framework v1.
 *
 * Legacy: SdkService / ApplicationManifest remain available for app manifests.
 */

export { JAG_SDK_VERSION } from "@/jag/sdk/version";

export {
  SdkService,
  emptyManifest,
  type ApplicationManifest,
} from "@/jag/sdk/platform-manifest";

export type {
  IndustryId,
  IndustryBlueprint,
  OrganizationBlueprint,
  IndustryStudioProfile,
  CapabilityPack,
  CapabilityPackDependency,
  CapabilityPackStatus,
  CapabilityPackLicense,
  CapabilityPackCompatibility,
  IndustryCatalogPayload,
  CatalogEntry,
  IndustryBlueprintComposition,
  FoundationCapabilityBinding,
  FrameworkValidationResult,
  FrameworkValidationIssue,
  OrganizationStudioAnswers,
  StudioIdentityAnswers,
  StudioLocationAnswer,
  StudioProgramAnswer,
  StudioRoleAnswer,
  StudioCalendarAnswer,
  StudioPolicyAnswer,
  StudioIntegrationAnswer,
  StudioAiAnswers,
  CapabilityPackValidationResult,
  CapabilityPackValidationIssue,
  SdkValidationResult,
  ScaffoldFile,
  ScaffoldResult,
} from "@/jag/sdk/public-types";

export {
  createCatalogEntry,
  buildIndustryCatalogs,
  listFoundationModules,
  buildFoundationComposition,
  buildModuleList,
  buildIndustryBlueprint,
  buildOrganizationBlueprint,
  buildDefaultOrganizationAnswers,
  buildCapabilityPack,
  type BuildIndustryCatalogsInput,
  type BuildIndustryBlueprintInput,
  type BuildOrganizationBlueprintInput,
  type BuildOrganizationBlueprintResult,
  type BuildCapabilityPackInput,
} from "@/jag/sdk/builders";

export {
  validateBlueprint,
  validateOrganization,
  validateCapabilityPack,
} from "@/jag/sdk/validation";

export {
  scaffoldIndustryBlueprint,
  scaffoldOrganizationBlueprint,
  scaffoldCapabilityPack,
} from "@/jag/sdk/scaffolding";

/** Framework constants useful to authors (no pack ids on industries). */
export {
  BLUEPRINT_FOUNDATION_MODULES,
  BLUEPRINT_FRAMEWORK_VERSION,
  BLUEPRINT_FRAMEWORK_STANDARD,
  REQUIRED_INDUSTRY_CATALOG_KEYS,
} from "@/jag/blueprint-framework";

/**
 * Marketplace install/discovery: import from `@/jag/marketplace`.
 * Kept separate so authoring (SDK) and package management (Marketplace)
 * do not form a circular module graph. Marketplace validates via SDK APIs.
 */
