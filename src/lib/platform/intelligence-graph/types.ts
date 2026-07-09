/** Platform Intelligence Graph — B-07 Phase 1 foundation types */

import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export const GRAPH_NODE_DEFINITION_STATUSES = ["draft", "active", "archived"] as const;
export type GraphNodeDefinitionStatus = (typeof GRAPH_NODE_DEFINITION_STATUSES)[number];

export const GRAPH_EDGE_DEFINITION_STATUSES = ["draft", "active", "archived"] as const;
export type GraphEdgeDefinitionStatus = (typeof GRAPH_EDGE_DEFINITION_STATUSES)[number];

export const GRAPH_EDGE_DIRECTIONS = ["directed", "bidirectional", "undirected"] as const;
export type GraphEdgeDirection = (typeof GRAPH_EDGE_DIRECTIONS)[number];

export const GRAPH_TRAVERSAL_STRATEGIES = ["breadth_first", "depth_first", "shortest_path"] as const;
export type GraphTraversalStrategy = (typeof GRAPH_TRAVERSAL_STRATEGIES)[number];

export const GRAPH_PROVIDER_KEYS = [
  "relationship",
  "activity",
  "event",
  "workflow",
  "decision",
  "notes",
  "tag",
  "profile",
  "persisted",
  "evidence",
  "rules",
] as const;
export type GraphProviderKey = (typeof GRAPH_PROVIDER_KEYS)[number];

/** Canonical graph node — derived from platform entity records. */
export interface GraphNode {
  nodeId: string;
  nodeType: string;
  entityType: string;
  entityId: string;
  organizationId: string | null;
  schoolId: string | null;
  metadata: Record<string, unknown>;
}

/** Canonical graph edge — sourced from platform service providers. */
export interface GraphEdge {
  edgeType: string;
  sourceNode: string;
  targetNode: string;
  direction: GraphEdgeDirection;
  weight: number;
  effectiveDate: string | null;
  endDate: string | null;
  metadata: Record<string, unknown>;
}

export interface GraphNodeDefinition {
  nodeType: string;
  name: string;
  description?: string;
  domain: string;
  providerKey: GraphProviderKey;
  entityTypes?: string[];
  status: GraphNodeDefinitionStatus;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface GraphEdgeDefinition {
  edgeType: string;
  name: string;
  description?: string;
  domain: string;
  providerKey: GraphProviderKey;
  sourceNodeTypes?: string[];
  targetNodeTypes?: string[];
  direction: GraphEdgeDirection;
  defaultWeight?: number;
  status: GraphEdgeDefinitionStatus;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface GraphRegistrySnapshot {
  nodeDefinitions: GraphNodeDefinition[];
  edgeDefinitions: GraphEdgeDefinition[];
  providers: GraphProviderKey[];
  nodeDomains: string[];
  edgeDomains: string[];
  registeredAt: string;
}

export interface GraphProviderContext {
  supabase: AuthClient;
  organizationId?: string | null;
  schoolId?: string | null;
}

export interface GraphNodeFilter {
  nodeTypes?: string | string[];
  entityTypes?: string | string[];
  organizationId?: string | null;
  schoolId?: string | null;
}

export interface GraphEdgeFilter {
  edgeTypes?: string | string[];
  providerKeys?: GraphProviderKey | GraphProviderKey[];
  direction?: GraphEdgeDirection | GraphEdgeDirection[];
  minWeight?: number;
  maxWeight?: number;
  activeOnly?: boolean;
}

export interface GraphTraversalOptions {
  strategy?: GraphTraversalStrategy;
  maxDepth?: number;
  nodeFilter?: GraphNodeFilter;
  edgeFilter?: GraphEdgeFilter;
  /** Limit nodes returned per traversal (default 500). */
  limit?: number;
}

export interface GraphTraversalResult {
  startNodeId: string;
  strategy: GraphTraversalStrategy;
  nodes: GraphNode[];
  edges: GraphEdge[];
  depthByNode: Record<string, number>;
  visitedCount: number;
  truncated: boolean;
}

export interface GraphNeighborhoodQuery {
  nodeId: string;
  depth?: number;
  nodeFilter?: GraphNodeFilter;
  edgeFilter?: GraphEdgeFilter;
  limit?: number;
}

export interface GraphNeighborhoodResult {
  centerNodeId: string;
  depth: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  truncated: boolean;
}

export interface GraphPathQuery {
  sourceNodeId: string;
  targetNodeId: string;
  maxDepth?: number;
  nodeFilter?: GraphNodeFilter;
  edgeFilter?: GraphEdgeFilter;
}

export interface GraphPathResult {
  found: boolean;
  sourceNodeId: string;
  targetNodeId: string;
  path: GraphNode[];
  edges: GraphEdge[];
  totalWeight: number;
}

export interface GraphSearchQuery {
  query: string;
  entityTypes?: string | string[];
  nodeTypes?: string | string[];
  providerKeys?: GraphProviderKey | GraphProviderKey[];
  organizationId?: string | null;
  schoolId?: string | null;
  limit?: number;
}

export interface GraphSearchResult {
  query: string;
  nodes: GraphNode[];
  matchCount: number;
  truncated: boolean;
}

export interface GraphSnapshotQuery {
  rootNodeId: string;
  depth?: number;
  nodeFilter?: GraphNodeFilter;
  edgeFilter?: GraphEdgeFilter;
  includeProviders?: GraphProviderKey[];
  limit?: number;
}

export interface GraphSnapshot {
  rootNodeId: string;
  depth: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  providers: GraphProviderKey[];
  capturedAt: string;
  truncated: boolean;
}

export interface EdgeResolveOptions {
  direction?: "outgoing" | "incoming" | "both";
  edgeFilter?: GraphEdgeFilter;
}

export interface GraphProvider {
  providerKey: GraphProviderKey;
  resolveNode(
    ctx: GraphProviderContext,
    entityType: string,
    entityId: string
  ): Promise<GraphNode | null>;
  resolveEdges(
    ctx: GraphProviderContext,
    node: GraphNode,
    options?: EdgeResolveOptions
  ): Promise<GraphEdge[]>;
  searchNodes?(
    ctx: GraphProviderContext,
    query: GraphSearchQuery
  ): Promise<GraphNode[]>;
}
