/**
 * Declared capabilities for the OpenAI reference provider.
 */

import type { ProviderCapabilities } from "@/jag/intelligence/providers/capabilities";

export const OPENAI_PROVIDER_CAPABILITIES: ProviderCapabilities = Object.freeze({
  structuredOutput: true,
  jsonMode: true,
  functionCalling: true,
  streaming: false,
  multimodal: false,
  contextWindowTokens: 128_000,
  extras: Object.freeze(["reference_implementation", "json_object_mode"]),
});
