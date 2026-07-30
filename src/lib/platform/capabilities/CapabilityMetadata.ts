/**
 * CapabilityMetadata — Sprint 207.
 */

export type CapabilityCategory =
  | "intelligence"
  | "workspace"
  | "platform"
  | "integration"
  | "custom";

export type CapabilityMetadata = {
  readonly tags: readonly string[];
  readonly owner: string;
  readonly sprint?: string;
  readonly docsHref?: string;
  readonly icon?: string;
};

export type CapabilityFeatureFlags = Readonly<Record<string, boolean>>;
