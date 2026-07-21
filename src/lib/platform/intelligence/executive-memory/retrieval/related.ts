import type { MemoryGraph } from "@/lib/platform/intelligence/executive-memory/graph/memory-graph";
import type { MemoryEntity } from "@/lib/platform/intelligence/executive-memory/types";

export function relatedEntities(graph: MemoryGraph, entityId: string): MemoryEntity[] {
  return graph.neighbors(entityId).map((n) => n.entity);
}

export function graphTraversal(
  graph: MemoryGraph,
  startId: string,
  maxDepth = 3
): MemoryEntity[] {
  return graph.traverse(startId, maxDepth);
}
