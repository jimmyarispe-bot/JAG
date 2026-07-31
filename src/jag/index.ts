/**
 * The JAG OS — public platform entry.
 */

export * from "@/jag/runtime";
export * from "@/jag/canonical";
export * from "@/jag/kernel";
/** Application manifest SDK (legacy). Developer toolkit: import from `@/jag/sdk`. */
export {
  SdkService,
  emptyManifest,
  type ApplicationManifest,
} from "@/jag/sdk/platform-manifest";
export * from "@/jag/schema";
export * from "@/jag/entities";
export * from "@/jag/forms";
export * from "@/jag/workflows";
export * from "@/jag/api";
export * from "@/jag/graph";
export * from "@/jag/processes";
export * from "@/jag/decisions";
export * from "@/jag/documents";
export * from "@/jag/communications";
export * from "@/jag/packages";
export * from "@/jag/navigation";
export * from "@/jag/diagnostics";
export * from "@/jag/modeling";
export * from "@/jag/blueprints";
export * from "@/jag/blueprint-framework";
export * from "@/jag/studio";
export * from "@/jag/runtime-generation";
export * from "@/jag/runtime-lifecycle";
export * from "@/jag/capability-packs";
/** Re-export marketplace without `stableStringify` (also exported by runtime-generation). */
export {
  JAG_MARKETPLACE_VERSION,
  JAG_MARKETPLACE_PLATFORM_VERSION,
  marketplaceChecksum,
  createSigningRepresentation,
  buildMarketplaceArtifact,
  LocalMarketplaceRegistry,
  getDefaultMarketplaceRegistry,
  resetDefaultMarketplaceRegistryForTests,
  resolveMarketplaceDependencies,
  MarketplaceInstaller,
  getDefaultMarketplaceInstaller,
  resetDefaultMarketplaceInstallerForTests,
  installMarketplaceArtifact,
  validateMarketplaceManifest,
  verifyMarketplaceChecksum,
  validateMarketplaceArtifact,
  validateMarketplaceCompatibility,
  validateMarketplaceArtifactWithSdk,
  seedLocalMarketplaceCatalog,
} from "@/jag/marketplace";
export type {
  MarketplaceArtifactKind,
  MarketplaceMaturity,
  MarketplaceTrustLevel,
  MarketplaceDependency,
  MarketplaceCompatibility,
  MarketplaceSigningRepresentation,
  MarketplaceMetadata,
  MarketplacePackageManifest,
  MarketplaceArtifactPayload,
  MarketplaceArtifact,
  MarketplaceValidationIssue,
  MarketplaceValidationResult,
  MarketplaceInstallRecord,
  MarketplaceInstallResult,
  MarketplaceResolveResult,
  BuildMarketplaceArtifactInput,
  MarketplaceListQuery,
  MarketplaceInstallerOptions,
  CompatibilityEnvironment,
} from "@/jag/marketplace";
export * from "@/jag/intelligence";


