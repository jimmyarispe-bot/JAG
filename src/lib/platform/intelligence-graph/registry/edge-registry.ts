import type { GraphEdgeDefinition } from "@/lib/platform/intelligence-graph/types";

const EDGE_REGISTRY = new Map<string, GraphEdgeDefinition>();
const DUPLICATE_EDGE_TYPES: string[] = [];

export function registerGraphEdgeDefinition(definition: GraphEdgeDefinition): void {
  if (EDGE_REGISTRY.has(definition.edgeType)) {
    DUPLICATE_EDGE_TYPES.push(definition.edgeType);
    return;
  }
  EDGE_REGISTRY.set(definition.edgeType, definition);
}

export function registerGraphEdgeDefinitions(definitions: GraphEdgeDefinition[]): void {
  for (const definition of definitions) {
    registerGraphEdgeDefinition(definition);
  }
}

export function getGraphEdgeDefinition(edgeType: string): GraphEdgeDefinition | undefined {
  return EDGE_REGISTRY.get(edgeType);
}

export function getGraphEdgeDefinitionsByDomain(domain: string): GraphEdgeDefinition[] {
  return [...EDGE_REGISTRY.values()]
    .filter((def) => def.domain === domain)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getActiveGraphEdgeDefinitions(): GraphEdgeDefinition[] {
  return [...EDGE_REGISTRY.values()]
    .filter((def) => def.status === "active")
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getAllGraphEdgeDefinitions(): GraphEdgeDefinition[] {
  return [...EDGE_REGISTRY.values()].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
}

export function getRegisteredGraphEdgeDomains(): string[] {
  return [...new Set([...EDGE_REGISTRY.values()].map((def) => def.domain))].sort();
}

export function getDuplicateGraphEdgeRegistrations(): string[] {
  return [...DUPLICATE_EDGE_TYPES];
}

export function isKnownGraphEdgeType(edgeType: string): boolean {
  return EDGE_REGISTRY.has(edgeType);
}

export function getGraphEdgeDefinitionsByProvider(
  providerKey: string
): GraphEdgeDefinition[] {
  return getAllGraphEdgeDefinitions().filter((def) => def.providerKey === providerKey);
}
