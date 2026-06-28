import type {
  GraphNodeDefinition,
  GraphProvider,
  GraphProviderKey,
} from "@/lib/platform/intelligence-graph/types";

const NODE_REGISTRY = new Map<string, GraphNodeDefinition>();
const DUPLICATE_NODE_TYPES: string[] = [];

export function registerGraphNodeDefinition(definition: GraphNodeDefinition): void {
  if (NODE_REGISTRY.has(definition.nodeType)) {
    DUPLICATE_NODE_TYPES.push(definition.nodeType);
    return;
  }
  NODE_REGISTRY.set(definition.nodeType, definition);
}

export function registerGraphNodeDefinitions(definitions: GraphNodeDefinition[]): void {
  for (const definition of definitions) {
    registerGraphNodeDefinition(definition);
  }
}

export function getGraphNodeDefinition(nodeType: string): GraphNodeDefinition | undefined {
  return NODE_REGISTRY.get(nodeType);
}

export function getGraphNodeDefinitionsByDomain(domain: string): GraphNodeDefinition[] {
  return [...NODE_REGISTRY.values()]
    .filter((def) => def.domain === domain)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getActiveGraphNodeDefinitions(): GraphNodeDefinition[] {
  return [...NODE_REGISTRY.values()]
    .filter((def) => def.status === "active")
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getAllGraphNodeDefinitions(): GraphNodeDefinition[] {
  return [...NODE_REGISTRY.values()].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
}

export function getRegisteredGraphNodeDomains(): string[] {
  return [...new Set([...NODE_REGISTRY.values()].map((def) => def.domain))].sort();
}

export function getDuplicateGraphNodeRegistrations(): string[] {
  return [...DUPLICATE_NODE_TYPES];
}

export function isKnownGraphNodeType(nodeType: string): boolean {
  return NODE_REGISTRY.has(nodeType);
}

const PROVIDER_REGISTRY = new Map<GraphProviderKey, GraphProvider>();

export function registerGraphProvider(provider: GraphProvider): void {
  PROVIDER_REGISTRY.set(provider.providerKey, provider);
}

export function getGraphProvider(providerKey: GraphProviderKey): GraphProvider | undefined {
  return PROVIDER_REGISTRY.get(providerKey);
}

export function getAllGraphProviders(): GraphProvider[] {
  return [...PROVIDER_REGISTRY.values()];
}

export function getRegisteredGraphProviderKeys(): GraphProviderKey[] {
  return [...PROVIDER_REGISTRY.keys()].sort();
}

export function isGraphProviderRegistered(providerKey: GraphProviderKey): boolean {
  return PROVIDER_REGISTRY.has(providerKey);
}
