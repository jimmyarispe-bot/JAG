import { getNode, listEdges, listNodes } from "@/lib/platform/graph/registry";
import { findDirectedCycles, walkReachable } from "@/lib/platform/graph/traversal";
import type {
  GraphValidationIssue,
  GraphValidationResult,
} from "@/lib/platform/graph/types";

/**
 * Validate graph integrity.
 */
export function validateGraph(): GraphValidationResult {
  const issues: GraphValidationIssue[] = [];

  // Broken references
  for (const edge of listEdges()) {
    if (!getNode(edge.from)) {
      issues.push({
        code: "broken_reference",
        message: `Edge "${edge.id}" from missing node "${edge.from}"`,
        edgeId: edge.id,
        nodeId: edge.from,
      });
    }
    if (!getNode(edge.to)) {
      issues.push({
        code: "broken_reference",
        message: `Edge "${edge.id}" to missing node "${edge.to}"`,
        edgeId: edge.id,
        nodeId: edge.to,
      });
    }
  }

  // Duplicate registrations (same id already unique in maps; check duplicate keys by kind)
  const seenKeys = new Map<string, string>();
  for (const node of listNodes()) {
    const key = `${node.kind}:${node.key}`;
    const prior = seenKeys.get(key);
    if (prior && prior !== node.id) {
      issues.push({
        code: "duplicate_registration",
        message: `Duplicate node key ${key}`,
        nodeId: node.id,
      });
    }
    seenKeys.set(key, node.id);
  }

  // Stub / orphaned placeholders
  for (const node of listNodes()) {
    if (node.stub) {
      issues.push({
        code: "orphaned_registration",
        message: `Stub node "${node.id}" references missing framework registration`,
        nodeId: node.id,
      });
    }
  }

  // Nodes with zero edges (unreachable isolates) when graph has edges
  const edges = listEdges();
  if (edges.length > 0) {
    const touched = new Set<string>();
    for (const edge of edges) {
      touched.add(edge.from);
      touched.add(edge.to);
    }
    for (const node of listNodes()) {
      if (!touched.has(node.id)) {
        issues.push({
          code: "unreachable_node",
          message: `Node "${node.id}" has no edges`,
          nodeId: node.id,
        });
      }
    }
  }

  // Invalid cycles on EXTENDS (and OWNS)
  for (const cycle of findDirectedCycles(["EXTENDS", "OWNS"])) {
    issues.push({
      code: "circular_dependency",
      message: `Invalid cycle: ${cycle.join(" → ")}`,
      nodeId: cycle[0],
    });
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Nodes not reachable from any application node (when applications exist).
 */
export function findUnreachableFromApplications(): string[] {
  const apps = listNodes({ kind: "application" });
  if (!apps.length) return [];

  const reachable = new Set<string>();
  for (const app of apps) {
    reachable.add(app.id);
    for (const id of walkReachable(app.id, { direction: "outgoing" })) {
      reachable.add(id);
    }
  }

  return listNodes()
    .map((n) => n.id)
    .filter((id) => !reachable.has(id))
    .sort();
}
