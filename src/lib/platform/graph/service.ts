import {
  createEdge,
  edgeId,
  linkNodes,
  upsertEdge,
} from "@/lib/platform/graph/edge";
import {
  createNode,
  ensureNode,
  nodeId,
  parseNodeId,
  upsertNode,
} from "@/lib/platform/graph/node";
import {
  dependencyReport,
  directNeighbors,
  downstreamImpact,
  graphStats,
  impactIfApplicationDisabled,
  impactOfSchemaChange,
  shortestRelationshipPath,
  transitiveClosure,
  upstreamDependencies,
} from "@/lib/platform/graph/query";
import {
  generateGraphDocumentation,
  reflectFrameworks,
} from "@/lib/platform/graph/reflection";
import {
  clearGraph,
  getEdge,
  getNode,
  GraphRegistry,
  listEdges,
  listNodes,
  putEdge,
  putNode,
  removeEdge,
  removeNode,
  resetGraphRegistryForTests,
} from "@/lib/platform/graph/registry";
import {
  findDirectedCycles,
  findShortestPath,
  walkReachable,
} from "@/lib/platform/graph/traversal";
import {
  findUnreachableFromApplications,
  validateGraph,
} from "@/lib/platform/graph/validation";
import type {
  GraphEdge,
  GraphEdgeType,
  GraphNode,
  GraphNodeKind,
} from "@/lib/platform/graph/types";

export function resetGraphFrameworkForTests(): void {
  resetGraphRegistryForTests();
}

/**
 * Universal Knowledge Graph service.
 * Derived in-memory semantic model — frameworks remain independent.
 */
export const GraphService = {
  registry: GraphRegistry,

  // Nodes
  registerNode(input: Parameters<typeof upsertNode>[0]): GraphNode {
    return upsertNode({ ...input, source: input.source ?? "manual" });
  },
  ensureNode,
  getNode,
  listNodes,
  removeNode,
  nodeId,
  parseNodeId,
  createNode,

  // Edges
  registerEdge(input: Parameters<typeof upsertEdge>[0]): GraphEdge {
    return upsertEdge({ ...input, source: input.source ?? "manual" });
  },
  link(
    type: GraphEdgeType,
    from: string,
    to: string,
    options?: Parameters<typeof linkNodes>[3]
  ): GraphEdge | null {
    // Ensure endpoints for manual links
    if (!getNode(from) || !getNode(to)) {
      throw new Error(`Cannot link: missing node ${!getNode(from) ? from : to}`);
    }
    return linkNodes(type, from, to, {
      ...options,
      source: options?.source ?? "manual",
      requireNodes: true,
    });
  },
  getEdge,
  listEdges,
  removeEdge,
  edgeId,
  createEdge,
  putNode,
  putEdge,

  // Reflection (consume frameworks — do not own them)
  reflect: reflectFrameworks,
  rebuild(): ReturnType<typeof reflectFrameworks> {
    return reflectFrameworks();
  },

  // Query engine
  neighbors: directNeighbors,
  upstream: upstreamDependencies,
  downstream: downstreamImpact,
  closure: transitiveClosure,
  shortestPath: shortestRelationshipPath,
  dependencies: dependencyReport,
  impactIfApplicationDisabled,
  impactOfSchemaChange,
  stats: graphStats,

  // Traversal primitives
  walk: walkReachable,
  findPath: findShortestPath,
  findCycles: findDirectedCycles,

  // Validation
  validate: validateGraph,
  unreachableFromApplications: findUnreachableFromApplications,

  // Documentation (derived)
  document: generateGraphDocumentation,

  clear: clearGraph,
  resetForTests: resetGraphFrameworkForTests,
} as const;

export type GraphServiceApi = typeof GraphService;

/** Convenience helpers for typed node creation. */
export function applicationNodeId(applicationId: string): string {
  return nodeId("application" satisfies GraphNodeKind, applicationId);
}

export function schemaNodeId(schemaId: string): string {
  return nodeId("schema", schemaId);
}

export function entityTypeNodeId(entityType: string): string {
  return nodeId("entity_type", entityType);
}
