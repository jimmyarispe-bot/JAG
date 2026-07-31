export {
  SdkService,
  resetSdkFrameworkForTests,
} from "@/lib/platform/sdk/service";
export type { SdkServiceApi } from "@/lib/platform/sdk/service";

export {
  SdkRegistry,
  putApplication,
  removeApplication,
  getApplication,
  listApplications,
  assertApplicationRegistered,
  resetSdkRegistryForTests,
} from "@/lib/platform/sdk/registry";

export { normalizeManifest, emptyManifest } from "@/lib/platform/sdk/manifest";
export { validateManifest } from "@/lib/platform/sdk/validation";

export {
  PLATFORM_CAPABILITIES,
  PLATFORM_CAPABILITY_LABELS,
  isPlatformCapability,
  resolveCapabilities,
  capabilitiesRequiredByArtifacts,
  hasCapability,
} from "@/lib/platform/sdk/capabilities";

export {
  PLATFORM_EXTENSION_POINTS,
  CAPABILITY_EXTENSION_POINTS,
  isSupportedExtensionPoint,
  listExtensionPointsForCapability,
  listAllExtensionPoints,
  listAllCapabilities,
} from "@/lib/platform/sdk/contracts";
export type { PlatformExtensionPoint } from "@/lib/platform/sdk/contracts";

export {
  PLATFORM_VERSION,
  compareSemver,
  checkCompatibility,
  isCompatible,
  normalizeCompatibility,
} from "@/lib/platform/sdk/compatibility";

export {
  canTransition,
  nextLifecycleState,
  assertTransition,
  isOperational,
  listLifecycleEvents,
  lifecycleTransitionIssue,
} from "@/lib/platform/sdk/lifecycle";

export {
  getManifest,
  listManifests,
  listEnabledApplications,
  isApplicationEnabled,
  resolveApplicationCapabilities,
  applicationsDeclaringCapability,
} from "@/lib/platform/sdk/application";

export {
  validateExtensions,
  extensionCapabilityWarnings,
  listManifestExtensions,
} from "@/lib/platform/sdk/extensions";

export type {
  ApplicationLifecycleEvent,
  ApplicationLifecycleState,
  ApplicationManifest,
  CapabilityResolution,
  CompatibilityMeta,
  LifecycleTransitionResult,
  ManifestApiRef,
  ManifestAutomationRef,
  ManifestDependency,
  ManifestEntityRef,
  ManifestExtension,
  ManifestFormRef,
  ManifestPermissionRef,
  ManifestSchemaRef,
  ManifestWorkflowRef,
  PlatformCapability,
  RegisteredApplication,
  SdkRegisterOptions,
  SdkValidationIssue,
  SdkValidationResult,
} from "@/lib/platform/sdk/types";
