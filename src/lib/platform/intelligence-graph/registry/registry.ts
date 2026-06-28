import {
  getActiveGraphEdgeDefinitions,
  getAllGraphEdgeDefinitions,
  getDuplicateGraphEdgeRegistrations,
  getGraphEdgeDefinition,
  getGraphEdgeDefinitionsByDomain,
  getGraphEdgeDefinitionsByProvider,
  getRegisteredGraphEdgeDomains,
  isKnownGraphEdgeType,
  registerGraphEdgeDefinition,
  registerGraphEdgeDefinitions,
} from "@/lib/platform/intelligence-graph/registry/edge-registry";
import {
  getActiveGraphNodeDefinitions,
  getAllGraphNodeDefinitions,
  getAllGraphProviders,
  getDuplicateGraphNodeRegistrations,
  getGraphNodeDefinition,
  getGraphNodeDefinitionsByDomain,
  getGraphProvider,
  getRegisteredGraphNodeDomains,
  getRegisteredGraphProviderKeys,
  isGraphProviderRegistered,
  isKnownGraphNodeType,
  registerGraphNodeDefinition,
  registerGraphNodeDefinitions,
  registerGraphProvider,
} from "@/lib/platform/intelligence-graph/registry/node-registry";
import type { GraphRegistrySnapshot } from "@/lib/platform/intelligence-graph/types";

let registered = false;

/** Combined graph registry snapshot — nodes, edges, and registered providers. */
export function getGraphRegistrySnapshot(): GraphRegistrySnapshot {
  return {
    nodeDefinitions: getAllGraphNodeDefinitions(),
    edgeDefinitions: getAllGraphEdgeDefinitions(),
    providers: getRegisteredGraphProviderKeys(),
    nodeDomains: getRegisteredGraphNodeDomains(),
    edgeDomains: getRegisteredGraphEdgeDomains(),
    registeredAt: new Date().toISOString(),
  };
}

export function getActiveGraphRegistrySnapshot(): GraphRegistrySnapshot {
  return {
    nodeDefinitions: getActiveGraphNodeDefinitions(),
    edgeDefinitions: getActiveGraphEdgeDefinitions(),
    providers: getRegisteredGraphProviderKeys(),
    nodeDomains: getRegisteredGraphNodeDomains(),
    edgeDomains: getRegisteredGraphEdgeDomains(),
    registeredAt: new Date().toISOString(),
  };
}

export function isGraphRegistryRegistered(): boolean {
  return registered;
}

export function markGraphRegistryRegistered(): void {
  registered = true;
}

export {
  getActiveGraphEdgeDefinitions,
  getActiveGraphNodeDefinitions,
  getAllGraphEdgeDefinitions,
  getAllGraphNodeDefinitions,
  getAllGraphProviders,
  getDuplicateGraphEdgeRegistrations,
  getDuplicateGraphNodeRegistrations,
  getGraphEdgeDefinition,
  getGraphEdgeDefinitionsByDomain,
  getGraphEdgeDefinitionsByProvider,
  getGraphNodeDefinition,
  getGraphNodeDefinitionsByDomain,
  getGraphProvider,
  getRegisteredGraphEdgeDomains,
  getRegisteredGraphNodeDomains,
  getRegisteredGraphProviderKeys,
  isGraphProviderRegistered,
  isKnownGraphEdgeType,
  isKnownGraphNodeType,
  registerGraphEdgeDefinition,
  registerGraphEdgeDefinitions,
  registerGraphNodeDefinition,
  registerGraphNodeDefinitions,
  registerGraphProvider,
};
