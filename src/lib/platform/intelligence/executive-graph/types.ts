/**
 * Executive Graph Analyzer — shared types (Sprint 025).
 *
 * Unified organizational reasoning graph connecting Admissions, Finance, HR,
 * Operations, Executive Intelligence, and Founder Intelligence.
 */

/** Semantic version of the Executive Graph Analyzer pack. */
export const EXECUTIVE_GRAPH_ANALYZER_VERSION = "0.1.0";

/** Domains united by the Executive Graph Analyzer. */
export const EXECUTIVE_GRAPH_DOMAINS = [
  "admissions",
  "finance",
  "hr",
  "operations",
  "executive",
  "founder",
] as const;
export type ExecutiveGraphDomain = (typeof EXECUTIVE_GRAPH_DOMAINS)[number];

/** Node kinds in the organizational reasoning graph. */
export const GRAPH_NODE_KINDS = [
  "signal",
  "kpi",
  "health",
  "alert",
  "priority",
  "risk",
  "opportunity",
  "constraint",
  "decision",
  "summary",
  "domain_root",
] as const;
export type GraphNodeKind = (typeof GRAPH_NODE_KINDS)[number];

/** Edge relation kinds used for causal / dependency reasoning. */
export const GRAPH_EDGE_KINDS = [
  "CAUSES",
  "CONTRIBUTES_TO",
  "DEPENDS_ON",
  "BLOCKS",
  "SUPPORTS",
  "IMPROVES",
  "DECLINES",
  "FUNDS",
  "MEASURES",
  "GENERATES",
  "INFORMS",
  "CONSTRAINS",
] as const;
export type GraphEdgeKind = (typeof GRAPH_EDGE_KINDS)[number];

/** Graph-local confidence bands. */
export const GRAPH_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export type GraphConfidenceLevel = (typeof GRAPH_CONFIDENCE_LEVELS)[number];

/** Priority bands for executive action. */
export const EXECUTIVE_PRIORITY_BANDS = [
  "critical",
  "high",
  "medium",
  "low",
  "monitor",
] as const;
export type ExecutivePriorityBand = (typeof EXECUTIVE_PRIORITY_BANDS)[number];

/** Opaque metadata — never use `any`. */
export type GraphMetadata = Record<string, unknown>;

/** Tenant / school scope for a graph instance. */
export interface GraphScope {
  organizationId: string | null;
  schoolId: string | null;
  regionId?: string | null;
  campusId?: string | null;
}

/** Evidence attached to a node or edge. */
export interface GraphEvidence {
  id: string;
  label: string;
  detail?: string;
  sourceDomain?: ExecutiveGraphDomain;
  sourceId?: string;
  value?: number | string | null;
  weight?: number;
}

/** Node in the organizational reasoning graph. */
export interface GraphNode {
  id: string;
  key: string;
  label: string;
  domain: ExecutiveGraphDomain;
  kind: GraphNodeKind;
  value?: number | string | null;
  status?: string | null;
  severity?: ExecutivePriorityBand | null;
  criticality: number;
  confidence: number;
  evidence: GraphEvidence[];
  metadata: GraphMetadata;
}

/** Directed edge between graph nodes. */
export interface GraphEdge {
  id: string;
  kind: GraphEdgeKind;
  sourceId: string;
  targetId: string;
  weight: number;
  confidence: number;
  direction: "positive" | "negative" | "neutral";
  ruleId?: string;
  reason?: string;
  evidence: GraphEvidence[];
  metadata: GraphMetadata;
}

/** Complete in-memory organizational reasoning graph. */
export interface Graph {
  id: string;
  builtAt: string;
  scope: GraphScope;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

/** Criticality score for a node or path. */
export interface CriticalityScore {
  nodeId: string;
  score: number;
  fanIn: number;
  fanOut: number;
  riskWeight: number;
  reasons: string[];
}

/** Executive priority ranking item. */
export interface ExecutivePriority {
  id: string;
  nodeId: string;
  title: string;
  band: ExecutivePriorityBand;
  score: number;
  domain: ExecutiveGraphDomain;
  rationale: string;
  confidence: number;
}

/** Calibrated confidence for a reasoning result. */
export interface ConfidenceScore {
  value: number;
  level: GraphConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

/** Root-cause finding. */
export interface RootCauseFinding {
  id: string;
  nodeId: string;
  label: string;
  domain: ExecutiveGraphDomain;
  score: number;
  confidence: ConfidenceScore;
  evidence: GraphEvidence[];
  impactedNodeIds: string[];
  summary: string;
}

/** Dependency analysis for a node. */
export interface DependencyFinding {
  nodeId: string;
  dependsOn: string[];
  dependedBy: string[];
  fanIn: number;
  fanOut: number;
  criticality: number;
}

/** Cascade / multi-hop impact path. */
export interface CascadePath {
  id: string;
  originNodeId: string;
  terminalNodeId: string;
  nodeIds: string[];
  edgeIds: string[];
  depth: number;
  impactScore: number;
  direction: "positive" | "negative" | "neutral";
  summary: string;
}

/** Risk propagation result along negative paths. */
export interface RiskPropagationResult {
  originNodeId: string;
  affectedNodeIds: string[];
  totalRisk: number;
  paths: CascadePath[];
  summary: string;
}

/** Constraint detected in the graph. */
export interface GraphConstraint {
  id: string;
  nodeId: string;
  kind: "blocks" | "capacity" | "compliance" | "funding" | "staffing";
  title: string;
  description: string;
  severity: ExecutivePriorityBand;
  blockedNodeIds: string[];
}

/** Opportunity discovered via positive support/improve paths. */
export interface GraphOpportunity {
  id: string;
  nodeId: string;
  title: string;
  description: string;
  estimatedLift: number;
  confidence: number;
  supportingNodeIds: string[];
  domain: ExecutiveGraphDomain;
}

/** Narrative finding from the executive reasoner. */
export interface ExecutiveFinding {
  id: string;
  title: string;
  summary: string;
  domain: ExecutiveGraphDomain;
  priority: ExecutivePriorityBand;
  confidence: ConfidenceScore;
  rootCauseIds: string[];
  cascadeIds: string[];
  recommendation?: string;
}

/** Unified analysis package produced by GraphAnalyzer. */
export interface GraphAnalysisResult {
  graphId: string;
  analyzedAt: string;
  rootCauses: RootCauseFinding[];
  dependencies: DependencyFinding[];
  cascades: CascadePath[];
  risks: RiskPropagationResult[];
  constraints: GraphConstraint[];
  opportunities: GraphOpportunity[];
  findings: ExecutiveFinding[];
  priorities: ExecutivePriority[];
  criticality: CriticalityScore[];
  recommendations: GraphRecommendation[];
  dashboard: DashboardProjection;
  metadata: GraphMetadata;
}

/** Actionable recommendation projected from priorities. */
export interface GraphRecommendation {
  id: string;
  title: string;
  action: string;
  reason: string;
  priority: ExecutivePriorityBand;
  nodeId: string;
  confidence: number;
  expectedImpact: string;
}

/** Flattened projection for executive dashboard consumption. */
export interface DashboardProjection {
  generatedAt: string;
  headline: string;
  overallRisk: number;
  overallOpportunity: number;
  topPriorities: ExecutivePriority[];
  topRootCauses: RootCauseFinding[];
  topOpportunities: GraphOpportunity[];
  activeConstraints: GraphConstraint[];
  domainSummaries: Array<{
    domain: ExecutiveGraphDomain;
    nodeCount: number;
    avgCriticality: number;
    status: string;
  }>;
  metrics: {
    nodeCount: number;
    edgeCount: number;
    findingCount: number;
    cascadeCount: number;
  };
}

/** Signal input used by GraphBuilder. */
export interface DomainSignalInput {
  key: string;
  label: string;
  domain: ExecutiveGraphDomain;
  kind?: GraphNodeKind;
  value?: number | string | null;
  status?: string | null;
  severity?: ExecutivePriorityBand | null;
  confidence?: number;
  evidence?: GraphEvidence[];
  metadata?: GraphMetadata;
}

/** Relation input used by GraphBuilder. */
export interface DomainRelationInput {
  sourceKey: string;
  targetKey: string;
  kind: GraphEdgeKind;
  weight?: number;
  confidence?: number;
  direction?: "positive" | "negative" | "neutral";
  ruleId?: string;
  reason?: string;
  evidence?: GraphEvidence[];
  metadata?: GraphMetadata;
}

/** Builder input assembling multi-domain signals. */
export interface GraphBuildInput {
  scope?: Partial<GraphScope>;
  builtAt?: string;
  signals?: DomainSignalInput[];
  relations?: DomainRelationInput[];
  /** Optional founder brief signals. */
  founder?: {
    healthScore?: number;
    healthStatus?: string;
    priorities?: Array<{ id: string; title: string; severity: string; confidence: number }>;
    risks?: Array<{ id: string; title: string; severity: string; probability: number; impact: number }>;
    opportunities?: Array<{ id: string; title: string; estimatedValue: number; confidence: number }>;
  };
  /** Optional organization-health pillar scores. */
  organizationHealth?: {
    overallScore?: number;
    enrollmentScore?: number;
    financialScore?: number;
    academicScore?: number;
    workforceScore?: number;
    complianceScore?: number;
    operationsScore?: number;
  };
  /** Optional executive KPI-like values. */
  executive?: {
    enrollment?: number;
    admissions?: number;
    revenue?: number;
    outstanding?: number;
    staff?: number;
    studentAttendance?: number;
    teacherAttendance?: number;
  };
  metadata?: GraphMetadata;
}

/** Query request for ExecutiveQueries. */
export interface ExecutiveQueryRequest {
  question: string;
  focusNodeKey?: string;
  domain?: ExecutiveGraphDomain;
  maxResults?: number;
}

/** Query answer with supporting graph context. */
export interface ExecutiveQueryResult {
  question: string;
  answer: string;
  confidence: ConfidenceScore;
  nodeIds: string[];
  findingIds: string[];
  evidence: GraphEvidence[];
}

/** Search request for GraphSearch. */
export interface GraphSearchRequest {
  query?: string;
  domain?: ExecutiveGraphDomain;
  kind?: GraphNodeKind;
  minCriticality?: number;
  limit?: number;
}

/** Search hit. */
export interface GraphSearchHit {
  node: GraphNode;
  score: number;
  matchedOn: string[];
}
