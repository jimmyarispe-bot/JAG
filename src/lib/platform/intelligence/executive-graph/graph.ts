/**
 * Executive Graph Analyzer — Graph façade helpers (Sprint 025).
 */

export type { Graph, GraphEdge, GraphNode, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";

export {
  createEdge,
  createNode,
  domainRootId,
  getNodeById,
  getNodeByKey,
  graphModel,
  incoming,
  nodeId,
  outgoing,
  upsertNode,
} from "@/lib/platform/intelligence/executive-graph/model";

export { GraphBuilder } from "@/lib/platform/intelligence/executive-graph/builder";
export { GraphRepository } from "@/lib/platform/intelligence/executive-graph/repository";
