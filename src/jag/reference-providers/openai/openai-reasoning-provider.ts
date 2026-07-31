/**
 * OpenAIReasoningProvider — ReasoningProvider surface over the same adapter.
 */

import type { ReasoningProvider } from "@/jag/intelligence/providers/reasoning-provider";
import type { IntelligenceProviderRequest } from "@/jag/intelligence/providers/request";
import {
  createOpenAIIntelligenceProvider,
  type OpenAIIntelligenceProviderOptions,
} from "@/jag/reference-providers/openai/openai-intelligence-provider";
import { OPENAI_PROVIDER_CAPABILITIES } from "@/jag/reference-providers/openai/capabilities";
import { OPENAI_REASONING_PROVIDER_ID } from "@/jag/reference-providers/openai/version";

export type OpenAIReasoningProviderOptions = OpenAIIntelligenceProviderOptions;

export function createOpenAIReasoningProvider(
  options: OpenAIReasoningProviderOptions
): ReasoningProvider & { readonly vendorLabel: "openai" } {
  const base = createOpenAIIntelligenceProvider({
    ...options,
    id: options.id ?? OPENAI_REASONING_PROVIDER_ID,
    displayName: options.displayName ?? "OpenAI Reasoning (Reference)",
  });

  return {
    ...base,
    kind: "reasoning",
    vendorLabel: "openai",
    capabilities: OPENAI_PROVIDER_CAPABILITIES,
  };
}

/** Concrete reference class implementing ReasoningProvider. */
export class OpenAIReasoningProvider {
  readonly id: string;
  readonly displayName: string;
  readonly kind = "reasoning" as const;
  readonly vendorLabel = "openai" as const;
  readonly capabilities = OPENAI_PROVIDER_CAPABILITIES;
  private readonly inner: ReturnType<typeof createOpenAIReasoningProvider>;

  constructor(options: OpenAIReasoningProviderOptions) {
    this.inner = createOpenAIReasoningProvider(options);
    this.id = this.inner.id;
    this.displayName = this.inner.displayName;
  }

  reason(request: IntelligenceProviderRequest) {
    return this.inner.reason(request);
  }
}
