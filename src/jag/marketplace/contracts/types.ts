/**
 * Marketplace Foundation v1 — artifact & registry contracts.
 * Package management layer only. Not an app-store UI.
 */

import type {
  CapabilityPack,
  IndustryBlueprint,
  OrganizationBlueprint,
} from "@/jag/blueprints/contracts";

export type MarketplaceArtifactKind =
  | "capability-pack"
  | "industry-blueprint"
  | "organization-blueprint";

export type MarketplaceMaturity =
  | "experimental"
  | "beta"
  | "stable";

export type MarketplaceTrustLevel =
  | "untrusted"
  | "community"
  | "verified"
  | "official";

export type MarketplaceDependency = {
  readonly id: string;
  readonly versionRange: string;
  readonly optional?: boolean;
};

export type MarketplaceCompatibility = {
  readonly jagSdkMin?: string;
  readonly jagSdkMax?: string;
  readonly jagPlatformMin?: string;
  readonly jagPlatformMax?: string;
  readonly blueprintFrameworkMin?: string;
  readonly blueprintFrameworkMax?: string;
};

export type MarketplaceSigningRepresentation = {
  readonly publisher: string;
  /** Placeholder — cryptographic signing not implemented in v1. */
  readonly signatureMetadata?: string;
  readonly trustLevel: MarketplaceTrustLevel;
};

export type MarketplaceMetadata = {
  readonly category?: string;
  readonly industry?: string;
  readonly supportedLocales?: readonly string[];
  readonly maturity: MarketplaceMaturity;
  readonly releaseNotes?: string;
};

/**
 * Package Manifest — every marketplace artifact publishes one.
 */
export type MarketplacePackageManifest = {
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly license: string;
  readonly description: string;
  readonly dependencies: readonly MarketplaceDependency[];
  readonly compatibility: MarketplaceCompatibility;
  readonly tags: readonly string[];
  readonly checksum: string;
  readonly kind: MarketplaceArtifactKind;
  /** Artifact id (pack id, industry id, or organization id). */
  readonly id: string;
  readonly signing: MarketplaceSigningRepresentation;
  readonly metadata: MarketplaceMetadata;
};

export type MarketplaceArtifactPayload =
  | { readonly kind: "capability-pack"; readonly pack: CapabilityPack }
  | { readonly kind: "industry-blueprint"; readonly industry: IndustryBlueprint }
  | {
      readonly kind: "organization-blueprint";
      readonly organization: OrganizationBlueprint;
    };

export type MarketplaceArtifact = {
  readonly manifest: MarketplacePackageManifest;
  readonly payload: MarketplaceArtifactPayload;
};

export type MarketplaceValidationIssue = {
  readonly path: string;
  readonly code: string;
  readonly message: string;
  readonly severity?: "error" | "warning";
};

export type MarketplaceValidationResult = {
  readonly ok: boolean;
  readonly issues: readonly MarketplaceValidationIssue[];
};

export type MarketplaceInstallRecord = {
  readonly id: string;
  readonly version: string;
  readonly kind: MarketplaceArtifactKind;
  readonly installedAt: string;
  readonly checksum: string;
  readonly resolvedDependencies: readonly string[];
};

export type MarketplaceInstallResult = {
  readonly ok: boolean;
  readonly installed?: readonly MarketplaceInstallRecord[];
  readonly plan?: readonly string[];
  readonly issues: readonly MarketplaceValidationIssue[];
};

export type MarketplaceResolveResult = {
  readonly ok: boolean;
  readonly order: readonly string[];
  readonly issues: readonly MarketplaceValidationIssue[];
};
