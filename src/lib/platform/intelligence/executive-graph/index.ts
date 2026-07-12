/**
 * Executive Graph Analyzer — public API (Sprint 025).
 *
 * Production reasoning engine unifying Admissions, Finance, HR, Operations,
 * Executive Intelligence, and Founder Intelligence into one organizational graph.
 */

export {
  EXECUTIVE_GRAPH_ANALYZER_VERSION,
  EXECUTIVE_GRAPH_DOMAINS,
  EXECUTIVE_PRIORITY_BANDS,
  GRAPH_CONFIDENCE_LEVELS,
  GRAPH_EDGE_KINDS,
  GRAPH_NODE_KINDS,
  type CascadePath,
  type ConfidenceScore as ConfidenceScoreResult,
  type CriticalityScore as CriticalityScoreResult,
  type DashboardProjection as DashboardProjectionResult,
  type DependencyFinding,
  type DomainRelationInput,
  type DomainSignalInput,
  type ExecutiveFinding,
  type ExecutiveGraphDomain,
  type ExecutivePriority as ExecutivePriorityItem,
  type ExecutivePriorityBand,
  type ExecutiveQueryRequest,
  type ExecutiveQueryResult,
  type Graph,
  type GraphAnalysisResult,
  type GraphBuildInput,
  type GraphConfidenceLevel,
  type GraphConstraint,
  type GraphEdge,
  type GraphEdgeKind,
  type GraphEvidence,
  type GraphMetadata,
  type GraphNode,
  type GraphNodeKind,
  type GraphOpportunity,
  type GraphRecommendation,
  type GraphScope,
  type GraphSearchHit,
  type GraphSearchRequest,
  type RiskPropagationResult,
  type RootCauseFinding,
} from "@/lib/platform/intelligence/executive-graph/types";

export type {
  CascadeAnalyzer as CascadeAnalyzerContract,
  ConfidenceScorer,
  ConstraintEngine as ConstraintEngineContract,
  CriticalityScorer,
  DashboardProjector,
  DependencyAnalyzer as DependencyAnalyzerContract,
  EvidenceHelper,
  ExecutiveGraphAnalyzerDependencies,
  ExecutivePriorityEngine,
  ExecutiveQueries as ExecutiveQueriesContract,
  ExecutiveReasoner as ExecutiveReasonerContract,
  GraphAnalyzer as GraphAnalyzerContract,
  GraphBuilder as GraphBuilderContract,
  GraphModelHelpers,
  GraphRepository as GraphRepositoryContract,
  GraphSearch as GraphSearchContract,
  OpportunityEngine as OpportunityEngineContract,
  RecommendationProjector,
  RiskPropagation as RiskPropagationContract,
  RootCauseAnalyzer as RootCauseAnalyzerContract,
  SignalCatalog,
} from "@/lib/platform/intelligence/executive-graph/contracts";

export {
  createEdge,
  createNode,
  domainRootId,
  getNodeById,
  getNodeByKey,
  graphModel,
  incoming,
  nodeId,
  outgoing,
  upsertNode,
} from "@/lib/platform/intelligence/executive-graph/model";

export {
  buildEdge,
  isBlockingEdge,
  isCausalEdge,
  isSupportiveEdge,
  nextEdgeId,
  resetGraphEdgeSeqForTests,
} from "@/lib/platform/intelligence/executive-graph/edges";

export {
  createEvidence,
  evidenceHelper,
  mergeEvidence,
} from "@/lib/platform/intelligence/executive-graph/evidence";

export {
  DOMAIN_NODE_CATALOG,
  DOMAIN_RELATION_CATALOG,
  DomainNodeCatalog,
} from "@/lib/platform/intelligence/executive-graph/nodes";

export {
  ConfidenceScore,
  ConfidenceScoreEngine,
  clamp01,
  levelFromValue,
  priorityBandFromScore,
  severityToScore,
  statusToPressure,
} from "@/lib/platform/intelligence/executive-graph/confidence";

export { CriticalityScore, CriticalityScoreEngine } from "@/lib/platform/intelligence/executive-graph/criticality";
export { ExecutivePriority, ExecutivePriorityRanker } from "@/lib/platform/intelligence/executive-graph/priority";
export { GraphBuilder } from "@/lib/platform/intelligence/executive-graph/builder";
export { GraphRepository } from "@/lib/platform/intelligence/executive-graph/repository";
export { RootCauseAnalyzer } from "@/lib/platform/intelligence/executive-graph/root-cause";
export { DependencyAnalyzer } from "@/lib/platform/intelligence/executive-graph/dependency";
export { CascadeAnalyzer } from "@/lib/platform/intelligence/executive-graph/cascade";
export { RiskPropagation } from "@/lib/platform/intelligence/executive-graph/risk-propagation";
export { OpportunityEngine } from "@/lib/platform/intelligence/executive-graph/opportunity";
export { ConstraintEngine } from "@/lib/platform/intelligence/executive-graph/constraint";
export { ExecutiveReasoner } from "@/lib/platform/intelligence/executive-graph/reasoner";
export { ExecutiveQueries } from "@/lib/platform/intelligence/executive-graph/queries";
export { GraphSearch } from "@/lib/platform/intelligence/executive-graph/search";
export {
  DashboardProjection,
  DashboardProjectionEngine,
} from "@/lib/platform/intelligence/executive-graph/dashboard-projection";
export { GraphRecommendationProjector } from "@/lib/platform/intelligence/executive-graph/recommendations";
export { GraphAnalyzer } from "@/lib/platform/intelligence/executive-graph/analyzer";

import { GraphAnalyzer } from "@/lib/platform/intelligence/executive-graph/analyzer";
import { GraphBuilder } from "@/lib/platform/intelligence/executive-graph/builder";
import type { ExecutiveGraphAnalyzerDependencies } from "@/lib/platform/intelligence/executive-graph/contracts";
import { GraphRepository } from "@/lib/platform/intelligence/executive-graph/repository";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";

/** Wired Executive Graph Analyzer stack. */
export interface ExecutiveGraphAnalyzerStack {
  builder: GraphBuilder;
  repository: GraphRepository;
  analyzer: GraphAnalyzer;
  buildAndAnalyze: (input?: GraphBuildInput) => {
    graph: Graph;
    analysis: GraphAnalysisResult;
  };
}

export interface CreateExecutiveGraphAnalyzerOptions
  extends ExecutiveGraphAnalyzerDependencies {
  repository?: GraphRepository;
  builder?: GraphBuilder;
}

/**
 * Create a fully wired Executive Graph Analyzer stack (DI entry point).
 */
export function createExecutiveGraphAnalyzer(
  options: CreateExecutiveGraphAnalyzerOptions = {}
): ExecutiveGraphAnalyzerStack {
  const builder = options.builder ?? new GraphBuilder({
    now: options.now,
    createId: options.createId,
  });
  const repository = options.repository ?? new GraphRepository();
  const analyzer = new GraphAnalyzer({
    ...options,
    repository,
  });

  return {
    builder,
    repository,
    analyzer,
    buildAndAnalyze(input: GraphBuildInput = {}) {
      const graph = builder.build(input);
      repository.save(graph);
      const analysis = analyzer.analyze(graph);
      return { graph, analysis };
    },
  };
}
