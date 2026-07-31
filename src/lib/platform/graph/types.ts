/**
 * JAG Knowledge Graph & Semantic Layer (Sprint 076).
 * Deterministic in-memory graph derived from platform registries.
 * No AI. No domain concepts (Student/Patient). Frameworks remain independent.
 */

/** Generic node kinds — never domain entity names. */
export type GraphNodeKind =
  | "application"
  | "organization"
  | "schema"
  | "entity_type"
  | "form"
  | "workflow"
  | "api_endpoint"
  | "decision"
  | "permission"
  | "notification"
  | "automation"
  | "forecasting"
  | "capability";

/** Typed edges — generic platform relationships only. */
export type GraphEdgeType =
  | "OWNS"
  | "PROJECTS_TO"
  | "USES"
  | "TRIGGERS"
  | "OPERATES_ON"
  | "ENABLES"
  | "EXTENDS"
  | "GOVERNS"
  | "REFERENCES"
  | "EXPOSES"
  | "EDITS"
  | "BINDS"
  | "RELATED_TO";

export type GraphSource = "manual" | "reflection";

export type GraphNode = {
  id: string;
  kind: GraphNodeKind;
  key: string;
  label: string;
  applicationId: string | null;
  organizationId: string | null;
  source: GraphSource;
  /** True when created as a placeholder for a missing target. */
  stub?: boolean;
  metadata: Record<string, unknown>;
};

export type GraphEdge = {
  id: string;
  type: GraphEdgeType;
  from: string;
  to: string;
  source: GraphSource;
  label?: string | null;
  metadata: Record<string, unknown>;
};

export type GraphNeighbor = {
  edge: GraphEdge;
  node: GraphNode;
  direction: "outgoing" | "incoming";
};

export type GraphPath = {
  nodes: string[];
  edges: string[];
  length: number;
};

export type DependencyReport = {
  nodeId: string;
  upstream: string[];
  downstream: string[];
  directNeighbors: GraphNeighbor[];
};

export type GraphValidationIssue = {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
};

export type GraphValidationResult = {
  valid: boolean;
  issues: GraphValidationIssue[];
};

export type GraphDocumentation = {
  title: string;
  generatedAt: string;
  nodeCount: number;
  edgeCount: number;
  markdown: string;
  dependencyMaps: Record<string, { upstream: string[]; downstream: string[] }>;
  applicationMaps: Record<string, string[]>;
  frameworkMaps: Record<string, string[]>;
  schemaMaps: Record<string, string[]>;
};

export type GraphStats = {
  nodes: number;
  edges: number;
  byKind: Record<string, number>;
  byEdgeType: Record<string, number>;
};
