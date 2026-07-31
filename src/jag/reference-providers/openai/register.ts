/**
 * Register OpenAI reference providers into an existing ProviderRegistry.
 */

import type { ProviderRegistry } from "@/jag/intelligence/providers/registry";
import {
  OpenAIIntelligenceProvider,
  type OpenAIIntelligenceProviderOptions,
} from "@/jag/reference-providers/openai/openai-intelligence-provider";
import {
  OpenAIReasoningProvider,
  type OpenAIReasoningProviderOptions,
} from "@/jag/reference-providers/openai/openai-reasoning-provider";

export type RegisterOpenAIProvidersOptions = {
  readonly registry: ProviderRegistry;
  readonly intelligence?: OpenAIIntelligenceProviderOptions;
  readonly reasoning?: OpenAIReasoningProviderOptions;
  /** Defaults to both when corresponding options are provided. */
  readonly modes?: readonly ("intelligence" | "reasoning")[];
};

/**
 * Explicit opt-in registration — nothing is auto-registered into the platform.
 */
export function registerOpenAIProviders(
  options: RegisterOpenAIProvidersOptions
): {
  readonly intelligence?: OpenAIIntelligenceProvider;
  readonly reasoning?: OpenAIReasoningProvider;
} {
  const modes = options.modes ?? [
    ...(options.intelligence ? (["intelligence"] as const) : []),
    ...(options.reasoning ? (["reasoning"] as const) : []),
  ];

  const result: {
    intelligence?: OpenAIIntelligenceProvider;
    reasoning?: OpenAIReasoningProvider;
  } = {};

  if (modes.includes("intelligence")) {
    if (!options.intelligence) {
      throw new Error(
        "registerOpenAIProviders: intelligence options are required"
      );
    }
    const provider = new OpenAIIntelligenceProvider(options.intelligence);
    options.registry.register(provider);
    result.intelligence = provider;
  }

  if (modes.includes("reasoning")) {
    if (!options.reasoning && !options.intelligence) {
      throw new Error(
        "registerOpenAIProviders: reasoning or intelligence options are required"
      );
    }
    const provider = new OpenAIReasoningProvider(
      options.reasoning ?? options.intelligence!
    );
    options.registry.register(provider);
    result.reasoning = provider;
  }

  return result;
}
