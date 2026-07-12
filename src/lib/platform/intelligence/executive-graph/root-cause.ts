/**
 * Executive Graph Analyzer — RootCauseAnalyzer (Sprint 025).
 */

import type { RootCauseAnalyzer as RootCauseAnalyzerContract } from "@/lib/platform/intelligence/executive-graph/contracts";
import { isCausalEdge } from "@/lib/platform/intelligence/executive-graph/edges";
import { incoming, outgoing } from "@/lib/platform/intelligence/executive-graph/model";
import { ConfidenceScoreEngine } from "@/lib/platform/intelligence/executive-graph/scorer";
import type {
  Graph,
  RootCauseFinding,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface RootCauseAnalyzerDependencies {
  confidence?: ConfidenceScoreEngine;
  createId?: (prefix: string) => string;
}

/**
 * RootCauseAnalyzer — finds upstream causal sources with outbound impact.
 */
export class RootCauseAnalyzer implements RootCauseAnalyzerContract {
  private readonly confidence: ConfidenceScoreEngine;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: RootCauseAnalyzerDependencies = {}) {
    this.confidence = dependencies.confidence ?? new ConfidenceScoreEngine();
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  analyze(graph: Graph): RootCauseFinding[] {
    const findings: RootCauseFinding[] = [];

    for (const node of graph.nodes) {
      if (node.kind === "domain_root") continue;

      const inCausal = incoming(graph, node.id).filter((e) => isCausalEdge(e.kind));
      const outCausal = outgoing(graph, node.id).filter((e) => isCausalEdge(e.kind));

      const isRoot =
        inCausal.length === 0 &&
        (outCausal.length > 0 ||
          node.kind === "risk" ||
          node.status === "critical" ||
          node.status === "warning" ||
          node.severity === "critical" ||
          node.severity === "high");

      if (!isRoot) continue;

      const impacted = outCausal.map((e) => e.targetId);
      const pressure =
        (node.status === "critical" || node.severity === "critical" ? 0.9 : 0) +
        (node.status === "warning" || node.severity === "high" ? 0.65 : 0) +
        Math.min(0.4, outCausal.length * 0.1) +
        node.criticality * 0.2;

      if (pressure < 0.35 && impacted.length === 0) continue;

      const score = Math.min(1, pressure);
      findings.push({
        id: this.createId("root"),
        nodeId: node.id,
        label: node.label,
        domain: node.domain,
        score,
        confidence: this.confidence.score([
          {
            key: "outbound_causal",
            label: "Outbound causal edges",
            contribution: Math.min(0.4, outCausal.length * 0.1),
          },
          {
            key: "status_pressure",
            label: "Status / severity pressure",
            contribution: Math.min(0.5, score * 0.5),
          },
          {
            key: "node_confidence",
            label: "Node confidence",
            contribution: node.confidence * 0.2,
          },
        ]),
        evidence: node.evidence,
        impactedNodeIds: impacted,
        summary:
          impacted.length > 0
            ? `${node.label} appears as an upstream driver affecting ${impacted.length} downstream node(s).`
            : `${node.label} shows elevated pressure without inbound causal drivers.`,
      });
    }

    return findings.sort((a, b) => b.score - a.score).slice(0, 15);
  }
}
