/**
 * Executive Graph Analyzer — contracts / interfaces only (Sprint 025).
 *
 * Leaf module: no imports from analyzer implementations (avoids cycles).
 */

import type {
  CascadePath,
  ConfidenceScore,
  CriticalityScore,
  DashboardProjection,
  DependencyFinding,
  DomainRelationInput,
  DomainSignalInput,
  ExecutiveFinding,
  ExecutivePriority,
  ExecutiveQueryRequest,
  ExecutiveQueryResult,
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
  GraphConstraint,
  GraphEdge,
  GraphEvidence,
  GraphNode,
  GraphOpportunity,
  GraphRecommendation,
  GraphSearchHit,
  GraphSearchRequest,
  GraphScope,
  RiskPropagationResult,
  RootCauseFinding,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface GraphBuilder {
  build(input: GraphBuildInput): Graph;
}

export interface GraphRepository {
  save(graph: Graph): Graph;
  get(graphId: string): Graph | null;
  getLatest(scope?: Partial<GraphScope>): Graph | null;
  list(scope?: Partial<GraphScope>): Graph[];
  clear(): void;
}

export interface GraphAnalyzer {
  analyze(graph: Graph): GraphAnalysisResult;
  analyzeLatest(scope?: Partial<GraphScope>): GraphAnalysisResult | null;
}

export interface RootCauseAnalyzer {
  analyze(graph: Graph): RootCauseFinding[];
}

export interface DependencyAnalyzer {
  analyze(graph: Graph): DependencyFinding[];
}

export interface CascadeAnalyzer {
  analyze(graph: Graph, originNodeId?: string, maxDepth?: number): CascadePath[];
}

export interface RiskPropagation {
  propagate(graph: Graph, originNodeId?: string): RiskPropagationResult[];
}

export interface ExecutiveReasoner {
  reason(input: {
    graph: Graph;
    rootCauses: RootCauseFinding[];
    cascades: CascadePath[];
    risks: RiskPropagationResult[];
    constraints: GraphConstraint[];
    opportunities: GraphOpportunity[];
  }): ExecutiveFinding[];
}

export interface OpportunityEngine {
  discover(graph: Graph): GraphOpportunity[];
}

export interface ConstraintEngine {
  detect(graph: Graph): GraphConstraint[];
}

export interface CriticalityScorer {
  score(graph: Graph): CriticalityScore[];
  scoreNode(graph: Graph, nodeId: string): CriticalityScore | null;
}

export interface ExecutivePriorityEngine {
  rank(input: {
    graph: Graph;
    criticality: CriticalityScore[];
    rootCauses: RootCauseFinding[];
    risks: RiskPropagationResult[];
    constraints: GraphConstraint[];
  }): ExecutivePriority[];
}

export interface ConfidenceScorer {
  score(factors: Array<{ key: string; label: string; contribution: number }>): ConfidenceScore;
  fromValue(value: number): ConfidenceScore;
}

export interface ExecutiveQueries {
  ask(graph: Graph, analysis: GraphAnalysisResult, request: ExecutiveQueryRequest): ExecutiveQueryResult;
}

export interface GraphSearch {
  search(graph: Graph, request: GraphSearchRequest): GraphSearchHit[];
  neighborhood(graph: Graph, nodeId: string, depth?: number): { nodes: GraphNode[]; edges: GraphEdge[] };
  path(graph: Graph, fromId: string, toId: string, maxDepth?: number): string[] | null;
}

export interface DashboardProjector {
  project(graph: Graph, analysis: Omit<GraphAnalysisResult, "dashboard">): DashboardProjection;
}

export interface GraphModelHelpers {
  createNode(partial: Omit<GraphNode, "criticality" | "confidence" | "evidence" | "metadata"> & Partial<GraphNode>): GraphNode;
  createEdge(partial: Omit<GraphEdge, "weight" | "confidence" | "direction" | "evidence" | "metadata"> & Partial<GraphEdge>): GraphEdge;
  nodeId(domain: string, key: string): string;
  getNodeByKey(graph: Graph, key: string): GraphNode | null;
  getNodeById(graph: Graph, id: string): GraphNode | null;
  outgoing(graph: Graph, nodeId: string): GraphEdge[];
  incoming(graph: Graph, nodeId: string): GraphEdge[];
}

export interface EvidenceHelper {
  create(partial: Omit<GraphEvidence, "id"> & { id?: string }): GraphEvidence;
  merge(existing: GraphEvidence[], incoming: GraphEvidence[]): GraphEvidence[];
}

export interface RecommendationProjector {
  fromPriorities(priorities: ExecutivePriority[], findings: ExecutiveFinding[]): GraphRecommendation[];
}

export interface SignalCatalog {
  defaultSignals(): DomainSignalInput[];
  defaultRelations(): DomainRelationInput[];
}

/** DI bag for the full analyzer stack. */
export interface ExecutiveGraphAnalyzerDependencies {
  builder?: GraphBuilder;
  repository?: GraphRepository;
  rootCause?: RootCauseAnalyzer;
  dependency?: DependencyAnalyzer;
  cascade?: CascadeAnalyzer;
  risk?: RiskPropagation;
  reasoner?: ExecutiveReasoner;
  opportunity?: OpportunityEngine;
  constraint?: ConstraintEngine;
  criticality?: CriticalityScorer;
  priority?: ExecutivePriorityEngine;
  confidence?: ConfidenceScorer;
  queries?: ExecutiveQueries;
  search?: GraphSearch;
  dashboard?: DashboardProjector;
  recommendations?: RecommendationProjector;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
