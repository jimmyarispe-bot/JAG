import type { ModelProviderAdapter, ModelProviderId } from "./types";

function deferredAdapter(
  id: ModelProviderId,
  name: string
): ModelProviderAdapter {
  return {
    id,
    name,
    isConfigured: () => false,
    async chat() {
      return {
        ok: true,
        deferred: true,
        message: `${name} chat deferred — adapter not configured`,
      };
    },
    async embed() {
      return {
        ok: true,
        deferred: true,
        message: `${name} embeddings deferred — adapter not configured`,
      };
    },
    async reason() {
      return {
        ok: true,
        deferred: true,
        message: `${name} reasoning deferred — adapter not configured`,
      };
    },
  };
}

const REGISTRY = new Map<ModelProviderId, ModelProviderAdapter>();

export function ensureModelProvidersRegistered(): void {
  const providers: Array<[ModelProviderId, string]> = [
    ["openai", "OpenAI"],
    ["anthropic", "Anthropic"],
    ["google", "Google"],
    ["local", "Local models"],
  ];
  for (const [id, name] of providers) {
    if (!REGISTRY.has(id)) REGISTRY.set(id, deferredAdapter(id, name));
  }
}

ensureModelProvidersRegistered();

export function getModelProvider(id: ModelProviderId): ModelProviderAdapter {
  ensureModelProvidersRegistered();
  return REGISTRY.get(id) ?? deferredAdapter(id, id);
}

export function listModelProviders(): ModelProviderAdapter[] {
  ensureModelProvidersRegistered();
  return [...REGISTRY.values()];
}

export async function invokeModelReasoning(input: {
  provider?: ModelProviderId;
  prompt: string;
}) {
  const start = Date.now();
  const provider = getModelProvider(input.provider ?? "openai");
  const result = await provider.reason({ prompt: input.prompt });
  return {
    ...result,
    provider: provider.id,
    latencyMs: Date.now() - start,
  };
}
