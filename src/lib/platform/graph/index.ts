export {
  GraphService,
  resetGraphFrameworkForTests,
  applicationNodeId,
  schemaNodeId,
  entityTypeNodeId,
} from "@/lib/platform/graph/service";
export type { GraphServiceApi } from "@/lib/platform/graph/service";

export {
  GraphRegistry,
  putNode,
  removeNode,
  getNode,
  listNodes,
  putEdge,
  removeEdge,
  getEdge,
  listEdges,
  clearGraph,
  resetGraphRegistryForTests,
} from "@/lib/platform/graph/registry";

export {
  nodeId,
  parseNodeId,
  createNode,
  upsertNode,
  ensureNode,
} from "@/lib/platform/graph/node";

export {
  edgeId,
  createEdge,
  upsertEdge,
  linkNodes,
} from "@/lib/platform/graph/edge";

export {
  directNeighbors,
  upstreamDependencies,
  downstreamImpact,
  transitiveClosure,
  shortestRelationshipPath,
  dependencyReport,
  impactIfApplicationDisabled,
  impactOfSchemaChange,
  graphStats,
} from "@/lib/platform/graph/query";

export {
  walkReachable,
  findShortestPath,
  findDirectedCycles,
} from "@/lib/platform/graph/traversal";
export type { TraversalDirection } from "@/lib/platform/graph/traversal";

export {
  reflectFrameworks,
  generateGraphDocumentation,
} from "@/lib/platform/graph/reflection";

export {
  validateGraph,
  findUnreachableFromApplications,
} from "@/lib/platform/graph/validation";

export type {
  DependencyReport,
  GraphDocumentation,
  GraphEdge,
  GraphEdgeType,
  GraphNeighbor,
  GraphNode,
  GraphNodeKind,
  GraphPath,
  GraphSource,
  GraphStats,
  GraphValidationIssue,
  GraphValidationResult,
} from "@/lib/platform/graph/types";
