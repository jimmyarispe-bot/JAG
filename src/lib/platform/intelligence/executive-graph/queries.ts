/**
 * Executive Graph Analyzer — ExecutiveQueries (Sprint 025).
 */

import type { ExecutiveQueries as ExecutiveQueriesContract } from "@/lib/platform/intelligence/executive-graph/contracts";
import { getNodeByKey } from "@/lib/platform/intelligence/executive-graph/model";
import { ConfidenceScoreEngine } from "@/lib/platform/intelligence/executive-graph/scorer";
import type {
  ExecutiveQueryRequest,
  ExecutiveQueryResult,
  Graph,
  GraphAnalysisResult,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface ExecutiveQueriesDependencies {
  confidence?: ConfidenceScoreEngine;
}

/**
 * ExecutiveQueries — natural-language-ish executive graph Q&A (deterministic).
 */
export class ExecutiveQueries implements ExecutiveQueriesContract {
  private readonly confidence: ConfidenceScoreEngine;

  constructor(dependencies: ExecutiveQueriesDependencies = {}) {
    this.confidence = dependencies.confidence ?? new ConfidenceScoreEngine();
  }

  ask(
    graph: Graph,
    analysis: GraphAnalysisResult,
    request: ExecutiveQueryRequest
  ): ExecutiveQueryResult {
    const question = request.question.trim();
    const lower = question.toLowerCase();
    const max = request.maxResults ?? 5;

    if (request.focusNodeKey) {
      const node = getNodeByKey(graph, request.focusNodeKey);
      if (node) {
        const related = analysis.rootCauses.filter((r) => r.nodeId === node.id);
        return {
          question,
          answer:
            related[0]?.summary ??
            `${node.label} currently shows status=${node.status ?? "n/a"} with criticality ${node.criticality.toFixed(2)}.`,
          confidence: this.confidence.fromValue(node.confidence),
          nodeIds: [node.id],
          findingIds: analysis.findings
            .filter((f) => f.rootCauseIds.some((id) => related.some((r) => r.id === id)))
            .map((f) => f.id),
          evidence: node.evidence,
        };
      }
    }

    if (lower.includes("root cause") || lower.includes("why")) {
      const roots = analysis.rootCauses.slice(0, max);
      return {
        question,
        answer:
          roots.length > 0
            ? `Top root causes: ${roots.map((r) => r.label).join("; ")}.`
            : "No dominant root causes identified.",
        confidence: this.confidence.fromValue(roots[0]?.confidence.value ?? 0.5),
        nodeIds: roots.map((r) => r.nodeId),
        findingIds: analysis.findings.slice(0, max).map((f) => f.id),
        evidence: roots.flatMap((r) => r.evidence).slice(0, 10),
      };
    }

    if (lower.includes("risk")) {
      const risks = analysis.risks.slice(0, max);
      return {
        question,
        answer:
          risks.length > 0
            ? `Highest risk origins affect ${risks.reduce((s, r) => s + r.affectedNodeIds.length, 0)} node(s).`
            : "No material risk propagation detected.",
        confidence: this.confidence.fromValue(risks[0]?.totalRisk ?? 0.4),
        nodeIds: risks.map((r) => r.originNodeId),
        findingIds: [],
        evidence: [],
      };
    }

    if (lower.includes("opportunit")) {
      const opps = analysis.opportunities.slice(0, max);
      return {
        question,
        answer:
          opps.length > 0
            ? `Top opportunities: ${opps.map((o) => o.title).join("; ")}.`
            : "No high-lift opportunities detected.",
        confidence: this.confidence.fromValue(opps[0]?.confidence ?? 0.4),
        nodeIds: opps.map((o) => o.nodeId),
        findingIds: [],
        evidence: [],
      };
    }

    if (lower.includes("priorit")) {
      const priorities = analysis.priorities.slice(0, max);
      return {
        question,
        answer:
          priorities.length > 0
            ? `Top priorities: ${priorities.map((p) => `${p.title} (${p.band})`).join("; ")}.`
            : "No elevated priorities.",
        confidence: this.confidence.fromValue(priorities[0]?.confidence ?? 0.5),
        nodeIds: priorities.map((p) => p.nodeId),
        findingIds: [],
        evidence: [],
      };
    }

    const domain = request.domain;
    const nodes = graph.nodes
      .filter((n) => (domain ? n.domain === domain : true) && n.kind !== "domain_root")
      .sort((a, b) => b.criticality - a.criticality)
      .slice(0, max);

    return {
      question,
      answer:
        nodes.length > 0
          ? `Most critical signals: ${nodes.map((n) => n.label).join("; ")}.`
          : "Graph has no matching nodes for this query.",
      confidence: this.confidence.fromValue(nodes[0]?.confidence ?? 0.4),
      nodeIds: nodes.map((n) => n.id),
      findingIds: analysis.findings.slice(0, max).map((f) => f.id),
      evidence: nodes.flatMap((n) => n.evidence).slice(0, 10),
    };
  }
}
