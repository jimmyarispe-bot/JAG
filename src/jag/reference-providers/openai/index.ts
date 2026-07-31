/**
 * OpenAI Reference Provider v1
 *
 * Concrete adapter behind Intelligence Provider Abstraction.
 * Not part of platform core. Not exported from `@/jag` or `@/jag/intelligence`.
 *
 * Import: `@/jag/reference-providers/openai`
 */

export {
  OPENAI_REFERENCE_PROVIDER_VERSION,
  OPENAI_INTELLIGENCE_PROVIDER_ID,
  OPENAI_REASONING_PROVIDER_ID,
} from "@/jag/reference-providers/openai/version";

export { OPENAI_PROVIDER_CAPABILITIES } from "@/jag/reference-providers/openai/capabilities";

export {
  OpenAIProviderError,
  isRetryableOpenAIError,
  type OpenAIProviderErrorCode,
} from "@/jag/reference-providers/openai/errors";

export { withRetries, type RetryOptions } from "@/jag/reference-providers/openai/retry";

export {
  createOpenAIFetchClient,
  type OpenAIChatClient,
  type OpenAIChatMessage,
  type OpenAIChatCompletionParams,
  type OpenAIChatCompletionResult,
  type OpenAIFetchClientOptions,
} from "@/jag/reference-providers/openai/client";

export {
  mapProviderRequestToOpenAI,
  type MappedOpenAIRequest,
} from "@/jag/reference-providers/openai/map-request";

export {
  mapOpenAICompletionToProviderResponse,
  type MapOpenAIResponseOptions,
} from "@/jag/reference-providers/openai/map-response";

export {
  OpenAIIntelligenceProvider,
  createOpenAIIntelligenceProvider,
  type OpenAIIntelligenceProviderOptions,
} from "@/jag/reference-providers/openai/openai-intelligence-provider";

export {
  OpenAIReasoningProvider,
  createOpenAIReasoningProvider,
  type OpenAIReasoningProviderOptions,
} from "@/jag/reference-providers/openai/openai-reasoning-provider";

export {
  registerOpenAIProviders,
  type RegisterOpenAIProvidersOptions,
} from "@/jag/reference-providers/openai/register";
