import { getRegisteredSchema, listRegisteredSchemas } from "@/lib/platform/schema/registry";
import type {
  PlatformSchema,
  SchemaRelationshipDefinition,
} from "@/lib/platform/schema/types";

export function listSchemaRelationships(
  schema: PlatformSchema
): SchemaRelationshipDefinition[] {
  return schema.relationships;
}

/**
 * Build adjacency of entityType → targetEntityType from registered schemas.
 */
export function buildRelationshipGraph(): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  for (const schema of listRegisteredSchemas()) {
    if (!graph.has(schema.entityType)) {
      graph.set(schema.entityType, new Set());
    }
    for (const rel of schema.relationships) {
      graph.get(schema.entityType)!.add(rel.targetEntityType);
      if (!graph.has(rel.targetEntityType)) {
        graph.set(rel.targetEntityType, new Set());
      }
    }
  }
  return graph;
}

/**
 * Detect directed cycles among entity relationship targets.
 * Bidirectional pairs (A↔B) are allowed; longer cycles are reported.
 */
export function findRelationshipCycles(): string[][] {
  const graph = buildRelationshipGraph();
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  function dfs(node: string): void {
    if (visited.has(node)) return;
    if (visiting.has(node)) {
      const idx = stack.indexOf(node);
      if (idx >= 0) {
        const cycle = stack.slice(idx).concat(node);
        if (cycle.length > 3) {
          // length > 3 means A→B→C→A (at least 3 distinct nodes)
          cycles.push(cycle);
        }
      }
      return;
    }
    visiting.add(node);
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      dfs(next);
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of graph.keys()) {
    dfs(node);
  }
  return cycles;
}

export function relationshipTargetExists(
  targetEntityType: string
): boolean {
  return listRegisteredSchemas({ entityType: targetEntityType }).length > 0;
}

export function getRelationshipsForEntityType(
  entityType: string
): SchemaRelationshipDefinition[] {
  const schemas = listRegisteredSchemas({ entityType });
  const out: SchemaRelationshipDefinition[] = [];
  const seen = new Set<string>();
  for (const schema of schemas) {
    for (const rel of schema.relationships) {
      if (seen.has(rel.key)) continue;
      seen.add(rel.key);
      out.push(rel);
    }
  }
  return out;
}

export function assertRelationshipDefined(
  schemaId: string,
  relationshipKey: string
): SchemaRelationshipDefinition {
  const schema = getRegisteredSchema(schemaId);
  if (!schema) {
    throw new Error(`Schema "${schemaId}" is not registered`);
  }
  const rel = schema.relationships.find((r) => r.key === relationshipKey);
  if (!rel) {
    throw new Error(
      `Schema "${schemaId}" has no relationship "${relationshipKey}"`
    );
  }
  return rel;
}
