/**
 * Build a MarketplaceArtifact with a complete, checksummed manifest.
 */

import type {
  CapabilityPack,
  IndustryBlueprint,
  OrganizationBlueprint,
} from "@/jag/blueprints/contracts";
import { marketplaceChecksum } from "@/jag/marketplace/checksum";
import type {
  MarketplaceArtifact,
  MarketplaceCompatibility,
  MarketplaceDependency,
  MarketplaceMaturity,
  MarketplaceMetadata,
  MarketplacePackageManifest,
  MarketplaceTrustLevel,
} from "@/jag/marketplace/contracts";
import { createSigningRepresentation } from "@/jag/marketplace/signing/trust";

export type BuildMarketplaceArtifactInput = {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly license?: string;
  readonly description: string;
  readonly dependencies?: readonly MarketplaceDependency[];
  readonly compatibility?: MarketplaceCompatibility;
  readonly tags?: readonly string[];
  readonly trustLevel?: MarketplaceTrustLevel;
  readonly metadata: Omit<MarketplaceMetadata, "maturity"> & {
    readonly maturity?: MarketplaceMaturity;
  };
  readonly payload:
    | { readonly kind: "capability-pack"; readonly pack: CapabilityPack }
    | { readonly kind: "industry-blueprint"; readonly industry: IndustryBlueprint }
    | {
        readonly kind: "organization-blueprint";
        readonly organization: OrganizationBlueprint;
      };
};

const DEFAULT_COMPAT: MarketplaceCompatibility = Object.freeze({
  jagSdkMin: "1.0.0",
  jagPlatformMin: "1.0.0",
  blueprintFrameworkMin: "1.0.0",
});

export function buildMarketplaceArtifact(
  input: BuildMarketplaceArtifactInput
): MarketplaceArtifact {
  const signing = createSigningRepresentation({
    publisher: input.author,
    trustLevel: input.trustLevel ?? "official",
  });
  const metadata: MarketplaceMetadata = Object.freeze({
    maturity: input.metadata.maturity ?? "stable",
    ...(input.metadata.category
      ? { category: input.metadata.category }
      : {}),
    ...(input.metadata.industry
      ? { industry: input.metadata.industry }
      : {}),
    ...(input.metadata.supportedLocales
      ? {
          supportedLocales: Object.freeze([
            ...input.metadata.supportedLocales,
          ]),
        }
      : {}),
    ...(input.metadata.releaseNotes
      ? { releaseNotes: input.metadata.releaseNotes }
      : {}),
  });

  const partial = {
    id: input.id,
    name: input.name,
    version: input.version,
    author: input.author,
    license: input.license ?? "UNLICENSED",
    description: input.description,
    dependencies: Object.freeze([...(input.dependencies ?? [])]),
    compatibility: Object.freeze({
      ...DEFAULT_COMPAT,
      ...(input.compatibility ?? {}),
    }),
    tags: Object.freeze([...(input.tags ?? [])]),
    kind: input.payload.kind,
    signing,
    metadata,
  };

  const checksum = marketplaceChecksum(partial);
  const manifest: MarketplacePackageManifest = Object.freeze({
    ...partial,
    checksum,
  });

  return Object.freeze({
    manifest,
    payload: Object.freeze(
      input.payload.kind === "capability-pack"
        ? { kind: "capability-pack" as const, pack: input.payload.pack }
        : input.payload.kind === "industry-blueprint"
          ? {
              kind: "industry-blueprint" as const,
              industry: input.payload.industry,
            }
          : {
              kind: "organization-blueprint" as const,
              organization: input.payload.organization,
            }
    ),
  });
}
