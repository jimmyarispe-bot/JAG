/**
 * OpenAIIntelligenceProvider — reference IntelligenceProvider implementation.
 * Lives outside the abstraction module and platform core.
 */

import type { IntelligenceProvider } from "@/jag/intelligence/providers/intelligence-provider";
import type { IntelligenceProviderRequest } from "@/jag/intelligence/providers/request";
import type { IntelligenceProviderResponse } from "@/jag/intelligence/providers/response";
import { OPENAI_PROVIDER_CAPABILITIES } from "@/jag/reference-providers/openai/capabilities";
import type { OpenAIChatClient } from "@/jag/reference-providers/openai/client";
import { OpenAIProviderError } from "@/jag/reference-providers/openai/errors";
import { mapProviderRequestToOpenAI } from "@/jag/reference-providers/openai/map-request";
import { mapOpenAICompletionToProviderResponse } from "@/jag/reference-providers/openai/map-response";
import { withRetries } from "@/jag/reference-providers/openai/retry";
import { OPENAI_INTELLIGENCE_PROVIDER_ID } from "@/jag/reference-providers/openai/version";

export type OpenAIIntelligenceProviderOptions = {
  readonly client: OpenAIChatClient;
  readonly model?: string;
  readonly maxAttempts?: number;
  readonly baseDelayMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly id?: string;
  readonly displayName?: string;
};

export function createOpenAIIntelligenceProvider(
  options: OpenAIIntelligenceProviderOptions
): IntelligenceProvider & { readonly vendorLabel: "openai" } {
  if (!options.client) {
    throw new OpenAIProviderError(
      "config",
      "OpenAIIntelligenceProvider requires a chat client"
    );
  }
  const model = options.model ?? "gpt-4o-mini";
  const providerId = options.id ?? OPENAI_INTELLIGENCE_PROVIDER_ID;

  return {
    id: providerId,
    displayName: options.displayName ?? "OpenAI Intelligence (Reference)",
    kind: "hybrid",
    vendorLabel: "openai",
    capabilities: OPENAI_PROVIDER_CAPABILITIES,
    async reason(
      request: IntelligenceProviderRequest
    ): Promise<IntelligenceProviderResponse> {
      const mapped = mapProviderRequestToOpenAI(request, model);
      let attempts = 0;
      const completion = await withRetries(
        async (attempt) => {
          attempts = attempt;
          return options.client.complete(mapped.completion);
        },
        {
          maxAttempts: options.maxAttempts ?? 3,
          baseDelayMs: options.baseDelayMs ?? 50,
          sleep: options.sleep,
        }
      );

      return mapOpenAICompletionToProviderResponse({
        providerId,
        allowedEvidenceIds: mapped.allowedEvidenceIds,
        rawCompletion: completion.content,
        model: completion.model ?? model,
        attempts,
      });
    },
  };
}

/** Concrete reference class implementing IntelligenceProvider. */
export class OpenAIIntelligenceProvider {
  readonly id: string;
  readonly displayName: string;
  readonly kind = "hybrid" as const;
  readonly vendorLabel = "openai" as const;
  readonly capabilities = OPENAI_PROVIDER_CAPABILITIES;
  private readonly inner: ReturnType<typeof createOpenAIIntelligenceProvider>;

  constructor(options: OpenAIIntelligenceProviderOptions) {
    this.inner = createOpenAIIntelligenceProvider(options);
    this.id = this.inner.id;
    this.displayName = this.inner.displayName;
  }

  reason(request: IntelligenceProviderRequest) {
    return this.inner.reason(request);
  }
}
