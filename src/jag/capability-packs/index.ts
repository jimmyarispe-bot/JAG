/**
 * JAG Capability Pack Architecture — public API (Sprint 019).
 *
 * Manifest types (`CapabilityPack`, license, dependencies, …) are defined on
 * `@/jag/blueprints` and re-exported from `@/jag`. This module exports
 * architecture behavior (validate, discover, enable, upgrade).
 */

export type {
  CapabilityPackCatalogEntry,
  CapabilityPackEnablement,
  CapabilityPackResolutionContext,
  CapabilityPackSelectionResult,
  CapabilityPackValidationIssue,
  CapabilityPackValidationResult,
} from "@/jag/capability-packs/contracts";
export { CAPABILITY_PACK_STATUSES } from "@/jag/capability-packs/contracts";

export {
  validateCapabilityPack,
  validateCapabilityPackSet,
} from "@/jag/capability-packs/validation";
export {
  compareSemver,
  packProvidesModules,
  satisfiesVersionRange,
} from "@/jag/capability-packs/versioning";
export {
  isPackCompatibleWithIndustry,
  isPackCompatibleWithModules,
  isPackCompatibleWithRuntime,
} from "@/jag/capability-packs/compatibility";
export { resolveEnabledCapabilityPacks } from "@/jag/capability-packs/enablement";
export {
  assertPackStatusTransition,
  canTransitionPackStatus,
} from "@/jag/capability-packs/lifecycle";
export {
  CAPABILITY_PACK_LICENSE_CATALOG,
  getCapabilityPackLicense,
} from "@/jag/capability-packs/licensing";
export {
  CapabilityPackCatalog,
  getDefaultCapabilityPackCatalog,
  resetDefaultCapabilityPackCatalogForTests,
  type CapabilityPackSearchQuery,
} from "@/jag/capability-packs/discovery";
export {
  findUpgradePath,
  isDeclaredUpgrade,
  isNewerPackVersion,
  listUpgradePaths,
} from "@/jag/capability-packs/upgrades";
export {
  createTestCapabilityPack,
  resetCapabilityPackArchitectureForTests,
} from "@/jag/capability-packs/testing";
