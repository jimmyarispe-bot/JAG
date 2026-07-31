/**
 * Package signing representation — metadata only.
 * Cryptographic signing is out of scope for Marketplace Foundation v1.
 */

import type {
  MarketplaceSigningRepresentation,
  MarketplaceTrustLevel,
} from "@/jag/marketplace/contracts";

export function createSigningRepresentation(input: {
  readonly publisher: string;
  readonly trustLevel?: MarketplaceTrustLevel;
  readonly signatureMetadata?: string;
}): MarketplaceSigningRepresentation {
  return Object.freeze({
    publisher: input.publisher,
    trustLevel: input.trustLevel ?? "community",
    ...(input.signatureMetadata
      ? { signatureMetadata: input.signatureMetadata }
      : {
          signatureMetadata:
            "unsigned:v1 — cryptographic signing not implemented",
        }),
  });
}
