/**
 * Provider capability negotiation surface.
 * Platform adapts to declared capabilities — architecture stays fixed.
 */

export const PROVIDER_CAPABILITY_FLAGS = Object.freeze([
  "structured_output",
  "json_mode",
  "function_calling",
  "streaming",
  "multimodal",
] as const);

export type ProviderCapabilityFlag =
  (typeof PROVIDER_CAPABILITY_FLAGS)[number];

/**
 * Declared capabilities of an intelligence provider.
 * Values are descriptive only — no SDK binding.
 */
export type ProviderCapabilities = {
  readonly structuredOutput: boolean;
  readonly jsonMode: boolean;
  readonly functionCalling: boolean;
  readonly streaming: boolean;
  readonly multimodal: boolean;
  /** Approximate context window in tokens, if known. */
  readonly contextWindowTokens?: number;
  /** Optional free-form feature tags for future negotiation. */
  readonly extras?: readonly string[];
};

export type CapabilityRequirement = {
  readonly structuredOutput?: boolean;
  readonly jsonMode?: boolean;
  readonly functionCalling?: boolean;
  readonly streaming?: boolean;
  readonly multimodal?: boolean;
  readonly minContextWindowTokens?: number;
};

export function isProviderCapabilities(
  value: unknown
): value is ProviderCapabilities {
  if (!value || typeof value !== "object") return false;
  const v = value as ProviderCapabilities;
  return (
    typeof v.structuredOutput === "boolean" &&
    typeof v.jsonMode === "boolean" &&
    typeof v.functionCalling === "boolean" &&
    typeof v.streaming === "boolean" &&
    typeof v.multimodal === "boolean" &&
    (v.contextWindowTokens === undefined ||
      (typeof v.contextWindowTokens === "number" &&
        v.contextWindowTokens > 0)) &&
    (v.extras === undefined ||
      (Array.isArray(v.extras) && v.extras.every((x) => typeof x === "string")))
  );
}

/** True when declared capabilities satisfy the requirement. */
export function capabilitiesSatisfy(
  capabilities: ProviderCapabilities,
  requirement: CapabilityRequirement
): boolean {
  if (requirement.structuredOutput && !capabilities.structuredOutput) {
    return false;
  }
  if (requirement.jsonMode && !capabilities.jsonMode) return false;
  if (requirement.functionCalling && !capabilities.functionCalling) {
    return false;
  }
  if (requirement.streaming && !capabilities.streaming) return false;
  if (requirement.multimodal && !capabilities.multimodal) return false;
  if (
    requirement.minContextWindowTokens !== undefined &&
    (capabilities.contextWindowTokens === undefined ||
      capabilities.contextWindowTokens < requirement.minContextWindowTokens)
  ) {
    return false;
  }
  return true;
}
