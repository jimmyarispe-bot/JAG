/**
 * Marketplace Foundation v1 — discovery, validation, installation.
 * Package management for Capability Packs, Industry Blueprints, and
 * Organization Blueprints. Not an app-store UI. No remote service.
 */

export {
  JAG_MARKETPLACE_VERSION,
  JAG_MARKETPLACE_PLATFORM_VERSION,
} from "@/jag/marketplace/version";

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
} from "@/jag/marketplace/contracts";

export { marketplaceChecksum, stableStringify } from "@/jag/marketplace/checksum";
export { createSigningRepresentation } from "@/jag/marketplace/signing/trust";
export {
  buildMarketplaceArtifact,
  type BuildMarketplaceArtifactInput,
} from "@/jag/marketplace/artifact-factory";

export {
  LocalMarketplaceRegistry,
  getDefaultMarketplaceRegistry,
  resetDefaultMarketplaceRegistryForTests,
  type MarketplaceListQuery,
} from "@/jag/marketplace/registry/local-registry";

export { resolveMarketplaceDependencies } from "@/jag/marketplace/dependency/resolve";

export {
  MarketplaceInstaller,
  getDefaultMarketplaceInstaller,
  resetDefaultMarketplaceInstallerForTests,
  installMarketplaceArtifact,
  type MarketplaceInstallerOptions,
} from "@/jag/marketplace/install/installer";

export {
  validateMarketplaceManifest,
  verifyMarketplaceChecksum,
  validateMarketplaceArtifact,
  validateMarketplaceCompatibility,
  validateMarketplaceArtifactWithSdk,
  type CompatibilityEnvironment,
} from "@/jag/marketplace/validation";

export { seedLocalMarketplaceCatalog } from "@/jag/marketplace/seed";
