import {
  getAllGraphEdgeDefinitions,
  getAllGraphNodeDefinitions,
  getDuplicateGraphEdgeRegistrations,
  getDuplicateGraphNodeRegistrations,
  getRegisteredGraphProviderKeys,
} from "@/lib/platform/intelligence-graph/registry/registry";
import type {
  GraphEdgeDefinition,
  GraphNodeDefinition,
} from "@/lib/platform/intelligence-graph/types";
import {
  GRAPH_EDGE_DIRECTIONS,
  GRAPH_PROVIDER_KEYS,
} from "@/lib/platform/intelligence-graph/types";

export interface GraphRegistryValidationIssue {
  code:
    | "duplicate_node_type"
    | "duplicate_edge_type"
    | "invalid_provider_key"
    | "invalid_edge_direction"
    | "missing_provider"
    | "inactive_node_definition"
    | "inactive_edge_definition";
  message: string;
}

export interface GraphRegistryValidationResult {
  ok: boolean;
  issues: GraphRegistryValidationIssue[];
}

function validateNodeDefinition(
  definition: GraphNodeDefinition,
  issues: GraphRegistryValidationIssue[]
): void {
  if (!GRAPH_PROVIDER_KEYS.includes(definition.providerKey)) {
    issues.push({
      code: "invalid_provider_key",
      message: `Node type "${definition.nodeType}" references unknown provider "${definition.providerKey}"`,
    });
  }
}

function validateEdgeDefinition(
  definition: GraphEdgeDefinition,
  issues: GraphRegistryValidationIssue[]
): void {
  if (!GRAPH_PROVIDER_KEYS.includes(definition.providerKey)) {
    issues.push({
      code: "invalid_provider_key",
      message: `Edge type "${definition.edgeType}" references unknown provider "${definition.providerKey}"`,
    });
  }

  if (!GRAPH_EDGE_DIRECTIONS.includes(definition.direction)) {
    issues.push({
      code: "invalid_edge_direction",
      message: `Edge type "${definition.edgeType}" uses invalid direction "${definition.direction}"`,
    });
  }
}

/** Validate platform intelligence graph registry integrity — intended for build-time checks. */
export function validateGraphRegistry(): GraphRegistryValidationResult {
  const issues: GraphRegistryValidationIssue[] = [];

  for (const duplicate of getDuplicateGraphNodeRegistrations()) {
    issues.push({
      code: "duplicate_node_type",
      message: `Duplicate node type "${duplicate}" registered`,
    });
  }

  for (const duplicate of getDuplicateGraphEdgeRegistrations()) {
    issues.push({
      code: "duplicate_edge_type",
      message: `Duplicate edge type "${duplicate}" registered`,
    });
  }

  const nodeTypes = new Set<string>();
  for (const definition of getAllGraphNodeDefinitions()) {
    if (nodeTypes.has(definition.nodeType)) {
      issues.push({
        code: "duplicate_node_type",
        message: `Duplicate node type "${definition.nodeType}"`,
      });
    }
    nodeTypes.add(definition.nodeType);
    validateNodeDefinition(definition, issues);
  }

  const edgeTypes = new Set<string>();
  for (const definition of getAllGraphEdgeDefinitions()) {
    if (edgeTypes.has(definition.edgeType)) {
      issues.push({
        code: "duplicate_edge_type",
        message: `Duplicate edge type "${definition.edgeType}"`,
      });
    }
    edgeTypes.add(definition.edgeType);
    validateEdgeDefinition(definition, issues);
  }

  const registeredProviders = new Set(getRegisteredGraphProviderKeys());
  for (const providerKey of GRAPH_PROVIDER_KEYS) {
    if (!registeredProviders.has(providerKey)) {
      issues.push({
        code: "missing_provider",
        message: `Graph provider "${providerKey}" is not registered`,
      });
    }
  }

  return { ok: issues.length === 0, issues };
}
