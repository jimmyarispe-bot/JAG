/**
 * Executive Graph Analyzer — GraphAnalyzer façade (Sprint 025).
 */

import { CascadeAnalyzer } from "@/lib/platform/intelligence/executive-graph/cascade";
import { ConfidenceScoreEngine } from "@/lib/platform/intelligence/executive-graph/confidence";
import { ConstraintEngine } from "@/lib/platform/intelligence/executive-graph/constraint";
import type {
  ExecutiveGraphAnalyzerDependencies,
  GraphAnalyzer as GraphAnalyzerContract,
} from "@/lib/platform/intelligence/executive-graph/contracts";
import { CriticalityScore } from "@/lib/platform/intelligence/executive-graph/criticality";
import { DashboardProjection } from "@/lib/platform/intelligence/executive-graph/dashboard-projection";
import { DependencyAnalyzer } from "@/lib/platform/intelligence/executive-graph/dependency";
import { ExecutiveQueries } from "@/lib/platform/intelligence/executive-graph/queries";
import { OpportunityEngine } from "@/lib/platform/intelligence/executive-graph/opportunity";
import { ExecutivePriority } from "@/lib/platform/intelligence/executive-graph/priority";
import { ExecutiveReasoner } from "@/lib/platform/intelligence/executive-graph/reasoner";
import { GraphRecommendationProjector } from "@/lib/platform/intelligence/executive-graph/recommendations";
import type { GraphRepository } from "@/lib/platform/intelligence/executive-graph/repository";
import { RiskPropagation } from "@/lib/platform/intelligence/executive-graph/risk-propagation";
import { RootCauseAnalyzer } from "@/lib/platform/intelligence/executive-graph/root-cause";
import { GraphSearch } from "@/lib/platform/intelligence/executive-graph/search";
import type {
  Graph,
  GraphAnalysisResult,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface GraphAnalyzerDependencies extends ExecutiveGraphAnalyzerDependencies {
  repository?: GraphRepository;
}

/**
 * GraphAnalyzer — orchestrates root-cause, dependency, cascade, risk, and reasoners.
 */
export class GraphAnalyzer implements GraphAnalyzerContract {
  private readonly repository: GraphRepository | null;
  private readonly rootCause: RootCauseAnalyzer;
  private readonly dependency: DependencyAnalyzer;
  private readonly cascade: CascadeAnalyzer;
  private readonly risk: RiskPropagation;
  private readonly reasoner: ExecutiveReasoner;
  private readonly opportunity: OpportunityEngine;
  private readonly constraint: ConstraintEngine;
  private readonly criticality: CriticalityScore;
  private readonly priority: ExecutivePriority;
  private readonly dashboard: DashboardProjection;
  private readonly recommendations: GraphRecommendationProjector;
  private readonly now: () => Date;

  readonly queries: ExecutiveQueries;
  readonly search: GraphSearch;
  readonly confidence: ConfidenceScoreEngine;

  constructor(dependencies: GraphAnalyzerDependencies = {}) {
    const now = dependencies.now ?? (() => new Date());
    const createId = dependencies.createId;
    this.now = now;
    this.repository = dependencies.repository ?? null;

    this.confidence =
      (dependencies.confidence as ConfidenceScoreEngine | undefined) ??
      new ConfidenceScoreEngine();
    this.rootCause =
      (dependencies.rootCause as RootCauseAnalyzer | undefined) ??
      new RootCauseAnalyzer({ confidence: this.confidence, createId });
    this.dependency =
      (dependencies.dependency as DependencyAnalyzer | undefined) ??
      new DependencyAnalyzer();
    this.cascade =
      (dependencies.cascade as CascadeAnalyzer | undefined) ??
      new CascadeAnalyzer({ createId });
    this.risk =
      (dependencies.risk as RiskPropagation | undefined) ??
      new RiskPropagation({ cascade: this.cascade });
    this.opportunity =
      (dependencies.opportunity as OpportunityEngine | undefined) ??
      new OpportunityEngine({ createId });
    this.constraint =
      (dependencies.constraint as ConstraintEngine | undefined) ??
      new ConstraintEngine({ createId });
    this.reasoner =
      (dependencies.reasoner as ExecutiveReasoner | undefined) ??
      new ExecutiveReasoner({ confidence: this.confidence, createId });
    this.criticality =
      (dependencies.criticality as CriticalityScore | undefined) ??
      new CriticalityScore();
    this.priority =
      (dependencies.priority as ExecutivePriority | undefined) ??
      new ExecutivePriority({ createId });
    this.dashboard =
      (dependencies.dashboard as DashboardProjection | undefined) ??
      new DashboardProjection({ now });
    this.recommendations =
      (dependencies.recommendations as GraphRecommendationProjector | undefined) ??
      new GraphRecommendationProjector({ createId });
    this.queries =
      (dependencies.queries as ExecutiveQueries | undefined) ??
      new ExecutiveQueries({ confidence: this.confidence });
    this.search =
      (dependencies.search as GraphSearch | undefined) ?? new GraphSearch();
  }

  analyze(graph: Graph): GraphAnalysisResult {
    const criticality = this.criticality.score(graph);
    const criticalityById = new Map(criticality.map((c) => [c.nodeId, c.score]));
    const enriched: Graph = {
      ...graph,
      nodes: graph.nodes.map((node) => ({
        ...node,
        criticality: criticalityById.get(node.id) ?? node.criticality,
      })),
    };

    const rootCauses = this.rootCause.analyze(enriched);
    const dependencies = this.dependency.analyze(enriched);
    const cascades = this.cascade.analyze(enriched);
    const risks = this.risk.propagate(enriched);
    const constraints = this.constraint.detect(enriched);
    const opportunities = this.opportunity.discover(enriched);
    const findings = this.reasoner.reason({
      graph: enriched,
      rootCauses,
      cascades,
      risks,
      constraints,
      opportunities,
    });
    const priorities = this.priority.rank({
      graph: enriched,
      criticality,
      rootCauses,
      risks,
      constraints,
    });
    const recommendations = this.recommendations.fromPriorities(priorities, findings);

    const partial = {
      graphId: enriched.id,
      analyzedAt: this.now().toISOString(),
      rootCauses,
      dependencies,
      cascades,
      risks,
      constraints,
      opportunities,
      findings,
      priorities,
      criticality,
      recommendations,
      metadata: {
        analyzer: "GraphAnalyzer",
        version: "0.1.0",
      },
    };

    const dashboard = this.dashboard.project(enriched, partial);

    return {
      ...partial,
      dashboard,
    };
  }

  analyzeLatest(scope?: Partial<GraphScope>): GraphAnalysisResult | null {
    if (!this.repository) return null;
    const graph = this.repository.getLatest(scope);
    if (!graph) return null;
    return this.analyze(graph);
  }
}
