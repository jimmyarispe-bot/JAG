/**
 * Validate Evidence Graph structural + organizational constraints.
 */

import {
  FORBIDDEN_EVIDENCE_KINDS,
  ORGANIZATIONAL_EVIDENCE_KINDS,
} from "@/jag/intelligence/evidence/reference-kinds";
import type { EvidenceGraph } from "@/jag/intelligence/evidence/types";
import type {
  IntelligenceValidationIssue,
  IntelligenceValidationResult,
} from "@/jag/intelligence/validation/validate-contracts";

function issue(
  path: string,
  code: string,
  message: string
): IntelligenceValidationIssue {
  return { path, code, message };
}

export function validateEvidenceGraph(
  graph: EvidenceGraph
): IntelligenceValidationResult {
  const issues: IntelligenceValidationIssue[] = [];
  if (!graph.id) {
    issues.push(issue("id", "invalid", "Graph id is required"));
  }

  const nodeIds = new Set<string>();
  for (const [index, node] of graph.nodes.entries()) {
    if (nodeIds.has(node.id)) {
      issues.push(
        issue(`nodes[${index}]`, "duplicate_node", `Duplicate node "${node.id}"`)
      );
    }
    nodeIds.add(node.id);
    if (
      (FORBIDDEN_EVIDENCE_KINDS as readonly string[]).includes(node.kind)
    ) {
      issues.push(
        issue(
          `nodes[${index}]`,
          "forbidden_kind",
          `Forbidden evidence kind "${node.kind}"`
        )
      );
    } else if (
      !(ORGANIZATIONAL_EVIDENCE_KINDS as readonly string[]).includes(node.kind)
    ) {
      issues.push(
        issue(
          `nodes[${index}]`,
          "unknown_kind",
          `Unknown evidence kind "${node.kind}"`
        )
      );
    }
  }

  for (const [index, edge] of graph.edges.entries()) {
    if (!nodeIds.has(edge.fromNodeId)) {
      issues.push(
        issue(
          `edges[${index}]`,
          "dangling_from",
          `Edge from unknown node "${edge.fromNodeId}"`
        )
      );
    }
    if (edge.toNodeId && !nodeIds.has(edge.toNodeId)) {
      issues.push(
        issue(
          `edges[${index}]`,
          "dangling_to",
          `Edge to unknown node "${edge.toNodeId}"`
        )
      );
    }
    if (!edge.toNodeId && !edge.toSink) {
      issues.push(
        issue(
          `edges[${index}]`,
          "invalid_edge",
          "Edge must have toNodeId or toSink"
        )
      );
    }
  }

  return { ok: issues.length === 0, issues };
}
