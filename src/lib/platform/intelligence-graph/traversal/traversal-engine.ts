import { resolveGraphEdges } from "@/lib/platform/intelligence-graph/resolver/edge-resolver";
import { resolveGraphNode } from "@/lib/platform/intelligence-graph/resolver/node-resolver";
import type {
  GraphEdge,
  GraphNode,
  GraphProviderContext,
  GraphTraversalOptions,
  GraphTraversalResult,
  GraphTraversalStrategy,
} from "@/lib/platform/intelligence-graph/types";
import {
  dedupeGraphEdges,
  dedupeGraphNodes,
  matchesEdgeFilter,
  matchesNodeFilter,
  parseGraphNodeId,
} from "@/lib/platform/intelligence-graph/utils";

const DEFAULT_TRAVERSAL_LIMIT = 500;

interface TraversalState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  depthByNode: Record<string, number>;
  visited: Set<string>;
  truncated: boolean;
}

async function expandNode(
  ctx: GraphProviderContext,
  node: GraphNode,
  depth: number,
  state: TraversalState,
  options: GraphTraversalOptions
): Promise<void> {
  const maxDepth = options.maxDepth ?? Infinity;
  const limit = options.limit ?? DEFAULT_TRAVERSAL_LIMIT;

  if (depth > maxDepth) return;
  if (state.visited.has(node.nodeId)) return;
  if (state.nodes.length >= limit) {
    state.truncated = true;
    return;
  }

  if (!matchesNodeFilter(node, options.nodeFilter)) return;

  state.visited.add(node.nodeId);
  state.nodes.push(node);
  state.depthByNode[node.nodeId] = depth;

  if (depth >= maxDepth) return;

  const edges = await resolveGraphEdges(ctx, {
    node,
    edgeFilter: options.edgeFilter,
  });

  const filteredEdges = options.edgeFilter
    ? edges.filter((edge) => matchesEdgeFilter(edge, options.edgeFilter))
    : edges;

  for (const edge of filteredEdges) {
    if (state.edges.length >= limit) {
      state.truncated = true;
      break;
    }

    state.edges.push(edge);

    const neighborId =
      edge.sourceNode === node.nodeId ? edge.targetNode : edge.sourceNode;

    if (state.visited.has(neighborId)) continue;

    const parsed = parseGraphNodeId(neighborId);
    if (!parsed) continue;

    const neighbor = await resolveGraphNode(ctx, { nodeId: neighborId });
    if (!neighbor) continue;

    await expandNode(ctx, neighbor, depth + 1, state, options);
  }
}

async function traverseBreadthFirst(
  ctx: GraphProviderContext,
  startNode: GraphNode,
  options: GraphTraversalOptions
): Promise<TraversalState> {
  const state: TraversalState = {
    nodes: [],
    edges: [],
    depthByNode: {},
    visited: new Set(),
    truncated: false,
  };

  const maxDepth = options.maxDepth ?? Infinity;
  const limit = options.limit ?? DEFAULT_TRAVERSAL_LIMIT;
  const queue: { node: GraphNode; depth: number }[] = [{ node: startNode, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (state.visited.has(current.node.nodeId)) continue;
    if (current.depth > maxDepth) continue;
    if (!matchesNodeFilter(current.node, options.nodeFilter)) continue;

    state.visited.add(current.node.nodeId);
    state.nodes.push(current.node);
    state.depthByNode[current.node.nodeId] = current.depth;

    if (state.nodes.length >= limit) {
      state.truncated = true;
      break;
    }

    if (current.depth >= maxDepth) continue;

    const edges = await resolveGraphEdges(ctx, {
      node: current.node,
      edgeFilter: options.edgeFilter,
    });

    const filteredEdges = options.edgeFilter
      ? edges.filter((edge) => matchesEdgeFilter(edge, options.edgeFilter))
      : edges;

    for (const edge of filteredEdges) {
      state.edges.push(edge);

      const neighborId =
        edge.sourceNode === current.node.nodeId ? edge.targetNode : edge.sourceNode;

      if (state.visited.has(neighborId)) continue;

      const neighbor = await resolveGraphNode(ctx, { nodeId: neighborId });
      if (!neighbor) continue;

      if (!matchesNodeFilter(neighbor, options.nodeFilter)) continue;

      queue.push({ node: neighbor, depth: current.depth + 1 });
    }
  }

  return state;
}

async function traverseDepthFirst(
  ctx: GraphProviderContext,
  startNode: GraphNode,
  options: GraphTraversalOptions
): Promise<TraversalState> {
  const state: TraversalState = {
    nodes: [],
    edges: [],
    depthByNode: {},
    visited: new Set(),
    truncated: false,
  };

  await expandNode(ctx, startNode, 0, state, options);
  return state;
}

/** Graph Traversal Engine — BFS, DFS, and shortest-path strategies over platform providers. */
export async function traverseGraph(
  ctx: GraphProviderContext,
  startNodeId: string,
  options: GraphTraversalOptions = {}
): Promise<GraphTraversalResult> {
  const strategy: GraphTraversalStrategy = options.strategy ?? "breadth_first";
  const startNode = await resolveGraphNode(ctx, { nodeId: startNodeId });

  if (!startNode) {
    return {
      startNodeId,
      strategy,
      nodes: [],
      edges: [],
      depthByNode: {},
      visitedCount: 0,
      truncated: false,
    };
  }

  let state: TraversalState;

  if (strategy === "depth_first") {
    state = await traverseDepthFirst(ctx, startNode, options);
  } else if (strategy === "shortest_path") {
    state = await traverseBreadthFirst(ctx, startNode, {
      ...options,
      maxDepth: options.maxDepth ?? 10,
    });
  } else {
    state = await traverseBreadthFirst(ctx, startNode, options);
  }

  return {
    startNodeId,
    strategy,
    nodes: dedupeGraphNodes(state.nodes),
    edges: dedupeGraphEdges(state.edges),
    depthByNode: state.depthByNode,
    visitedCount: state.visited.size,
    truncated: state.truncated,
  };
}
