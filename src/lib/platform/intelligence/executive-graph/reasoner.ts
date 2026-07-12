/**
 * Executive Graph Analyzer — ExecutiveReasoner (Sprint 025).
 */

import type { ExecutiveReasoner as ExecutiveReasonerContract } from "@/lib/platform/intelligence/executive-graph/contracts";
import { ConfidenceScoreEngine, priorityBandFromScore } from "@/lib/platform/intelligence/executive-graph/scorer";
import type {
  CascadePath,
  ExecutiveFinding,
  Graph,
  GraphConstraint,
  GraphOpportunity,
  RiskPropagationResult,
  RootCauseFinding,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface ExecutiveReasonerDependencies {
  confidence?: ConfidenceScoreEngine;
  createId?: (prefix: string) => string;
}

/**
 * ExecutiveReasoner — combines root cause, cascade, and constraints into findings.
 */
export class ExecutiveReasoner implements ExecutiveReasonerContract {
  private readonly confidence: ConfidenceScoreEngine;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: ExecutiveReasonerDependencies = {}) {
    this.confidence = dependencies.confidence ?? new ConfidenceScoreEngine();
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  reason(input: {
    graph: Graph;
    rootCauses: RootCauseFinding[];
    cascades: CascadePath[];
    risks: RiskPropagationResult[];
    constraints: GraphConstraint[];
    opportunities: GraphOpportunity[];
  }): ExecutiveFinding[] {
    const findings: ExecutiveFinding[] = [];

    for (const root of input.rootCauses.slice(0, 8)) {
      const relatedCascades = input.cascades
        .filter((c) => c.originNodeId === root.nodeId)
        .slice(0, 3);
      const relatedRisk = input.risks.find((r) => r.originNodeId === root.nodeId);
      const priority = priorityBandFromScore(
        Math.max(root.score, relatedRisk?.totalRisk ?? 0)
      );

      findings.push({
        id: this.createId("finding"),
        title: `Root cause: ${root.label}`,
        summary: root.summary,
        domain: root.domain,
        priority,
        confidence: root.confidence,
        rootCauseIds: [root.id],
        cascadeIds: relatedCascades.map((c) => c.id),
        recommendation: `Investigate and remediate ${root.label} to reduce downstream impact.`,
      });
    }

    for (const constraint of input.constraints.slice(0, 5)) {
      const node = input.graph.nodes.find((n) => n.id === constraint.nodeId);
      findings.push({
        id: this.createId("finding"),
        title: constraint.title,
        summary: constraint.description,
        domain: node?.domain ?? "executive",
        priority: constraint.severity,
        confidence: this.confidence.fromValue(0.7),
        rootCauseIds: [],
        cascadeIds: [],
        recommendation: `Resolve constraint on ${node?.label ?? constraint.nodeId}.`,
      });
    }

    for (const opportunity of input.opportunities.slice(0, 4)) {
      findings.push({
        id: this.createId("finding"),
        title: opportunity.title,
        summary: opportunity.description,
        domain: opportunity.domain,
        priority: priorityBandFromScore(opportunity.estimatedLift),
        confidence: this.confidence.fromValue(opportunity.confidence),
        rootCauseIds: [],
        cascadeIds: [],
        recommendation: `Pursue opportunity around ${opportunity.title}.`,
      });
    }

    if (findings.length === 0) {
      findings.push({
        id: this.createId("finding"),
        title: "Stable organizational graph",
        summary:
          "No elevated root causes, constraints, or high-lift opportunities detected in the current graph.",
        domain: "executive",
        priority: "monitor",
        confidence: this.confidence.fromValue(0.6),
        rootCauseIds: [],
        cascadeIds: [],
        recommendation: "Maintain monitoring cadence across domains.",
      });
    }

    return findings;
  }
}
