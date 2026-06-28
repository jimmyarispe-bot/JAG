/** Build canonical graph node identifier. */
export function buildGraphNodeId(
  nodeType: string,
  entityType: string,
  entityId: string
): string {
  return `${nodeType}:${entityType}:${entityId}`;
}

/** Parse a graph node identifier into its components. */
export function parseGraphNodeId(nodeId: string): {
  nodeType: string;
  entityType: string;
  entityId: string;
} | null {
  const parts = nodeId.split(":");
  if (parts.length < 3) return null;
  const nodeType = parts[0]!;
  const entityType = parts[1]!;
  const entityId = parts.slice(2).join(":");
  if (!nodeType || !entityType || !entityId) return null;
  return { nodeType, entityType, entityId };
}

/** Normalize filter values to arrays. */
export function normalizeFilterValues<T>(value: T | T[] | undefined): T[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
}

/** Check whether an edge is active at the current time. */
export function isEdgeActive(
  effectiveDate: string | null,
  endDate: string | null,
  at?: string
): boolean {
  const now = at ?? new Date().toISOString();
  if (effectiveDate && effectiveDate > now) return false;
  if (endDate && endDate <= now) return false;
  return true;
}

/** Deduplicate graph nodes by nodeId. */
export function dedupeGraphNodes<T extends { nodeId: string }>(nodes: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const node of nodes) {
    if (seen.has(node.nodeId)) continue;
    seen.add(node.nodeId);
    result.push(node);
  }
  return result;
}

/** Deduplicate graph edges by source, target, and type. */
export function dedupeGraphEdges<T extends { sourceNode: string; targetNode: string; edgeType: string }>(
  edges: T[]
): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const edge of edges) {
    const key = `${edge.edgeType}|${edge.sourceNode}|${edge.targetNode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(edge);
  }
  return result;
}

/** Match a node against optional graph node filters. */
export function matchesNodeFilter(
  node: { nodeType: string; entityType: string; organizationId: string | null; schoolId: string | null },
  filter?: {
    nodeTypes?: string | string[];
    entityTypes?: string | string[];
    organizationId?: string | null;
    schoolId?: string | null;
  }
): boolean {
  if (!filter) return true;

  const nodeTypes = normalizeFilterValues(filter.nodeTypes);
  if (nodeTypes && !nodeTypes.includes(node.nodeType)) return false;

  const entityTypes = normalizeFilterValues(filter.entityTypes);
  if (entityTypes && !entityTypes.includes(node.entityType)) return false;

  if (filter.organizationId !== undefined && node.organizationId !== filter.organizationId) {
    return false;
  }

  if (filter.schoolId !== undefined && node.schoolId !== filter.schoolId) {
    return false;
  }

  return true;
}

/** Match an edge against optional graph edge filters. */
export function matchesEdgeFilter(
  edge: {
    edgeType: string;
    weight: number;
    effectiveDate: string | null;
    endDate: string | null;
    metadata: Record<string, unknown>;
  },
  filter?: {
    edgeTypes?: string | string[];
    providerKeys?: string | string[];
    direction?: string | string[];
    minWeight?: number;
    maxWeight?: number;
    activeOnly?: boolean;
  }
): boolean {
  if (!filter) return true;

  const edgeTypes = normalizeFilterValues(filter.edgeTypes);
  if (edgeTypes && !edgeTypes.includes(edge.edgeType)) return false;

  const providerKeys = normalizeFilterValues(filter.providerKeys);
  if (providerKeys) {
    const providerKey = edge.metadata.providerKey as string | undefined;
    if (!providerKey || !providerKeys.includes(providerKey)) return false;
  }

  if (filter.minWeight !== undefined && edge.weight < filter.minWeight) return false;
  if (filter.maxWeight !== undefined && edge.weight > filter.maxWeight) return false;

  if (filter.activeOnly !== false && !isEdgeActive(edge.effectiveDate, edge.endDate)) {
    return false;
  }

  return true;
}
