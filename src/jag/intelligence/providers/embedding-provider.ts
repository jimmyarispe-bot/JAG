/**
 * EmbeddingProvider — reserved for future retrieval ranking.
 * Embeddings must never become Evidence (opaque_embedding is forbidden).
 */

import type { ProviderCapabilities } from "@/jag/intelligence/providers/capabilities";

export type EmbeddingVector = {
  readonly dimensions: number;
  readonly values: readonly number[];
};

export type EmbeddingProvider = {
  readonly id: string;
  readonly displayName: string;
  readonly kind: "embedding";
  readonly capabilities: ProviderCapabilities;
  embed?(
    texts: readonly string[]
  ): Promise<readonly EmbeddingVector[]> | readonly EmbeddingVector[];
};
