/**
 * Blueprint Framework v1 — industry composition contracts.
 * Module → capability keys only. Never pack ids.
 */

export type FoundationCapabilityBinding = {
  readonly module: string;
  readonly capability: string;
};

export type IndustryBlueprintComposition = {
  readonly version: string;
  readonly foundationModules: readonly string[];
  readonly verticalModules: readonly string[];
  readonly foundationCapabilities: readonly FoundationCapabilityBinding[];
};
