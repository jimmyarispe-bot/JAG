/** Evidence Knowledge Graph™ — explicit relational graph model (no AI). */

export const KNOWLEDGE_GRAPH_NODE_TYPES = [
  "Organization",
  "Product",
  "Evidence",
  "Business Unit",
  "Department",
  "Person",
  "Project",
  "Goal",
  "KPI",
  "Event",
  "Communication",
  /** Digital Twin™ extensions */
  "Team",
  "Role",
  "Asset",
  "Location",
  "Task",
  "Document",
  "Decision",
  "Risk",
  "Opportunity",
] as const;

export type KnowledgeGraphNodeType =
  (typeof KNOWLEDGE_GRAPH_NODE_TYPES)[number];

export const KNOWLEDGE_GRAPH_RELATIONSHIP_TYPES = [
  "BELONGS_TO",
  "SUPPORTED_BY",
  "REFERENCES",
  "GENERATED_FROM",
  "ASSOCIATED_WITH",
  "SUPERSEDES",
  "OWNS",
  /** Digital Twin™ extensions */
  "REPORTS_TO",
  "MANAGES",
  "ASSIGNED_TO",
  "PARTICIPATES_IN",
  "LOCATED_AT",
  "DEPENDS_ON",
  "SUPPORTS",
  "MEASURES",
  "CREATED_FROM",
  /** Goals & Strategy™ extensions */
  "MEASURED_BY",
  "BLOCKED_BY",
  "OWNED_BY",
  /** Risk & Compliance™ extensions */
  "THREATENS",
  "MITIGATED_BY",
  "CONTROLLED_BY",
  "IMPACTS",
  "MONITORED_BY",
  /** Work & Execution™ extensions */
  "BLOCKS",
  "PRODUCES",
  /** Organizational Memory™ extensions */
  "DOCUMENTS",
  "EXPLAINS",
  "RESULTED_FROM",
] as const;

export type KnowledgeGraphRelationshipType =
  (typeof KNOWLEDGE_GRAPH_RELATIONSHIP_TYPES)[number];

/** Placeholder node types — present in the model, not fully populated this sprint. */
export const PLACEHOLDER_NODE_TYPES = [
  "Person",
  "Project",
  "Goal",
  "KPI",
  "Event",
  "Communication",
] as const;

export type KnowledgeGraphNode = {
  readonly id: string;
  readonly organizationId: string;
  readonly nodeType: KnowledgeGraphNodeType;
  readonly label: string;
  /** Reused domain id when available (evidence id, org id, etc.). */
  readonly externalId: string | null;
  readonly metadata: Readonly<Record<string, string>>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type KnowledgeGraphEdge = {
  readonly id: string;
  readonly organizationId: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly relationshipType: KnowledgeGraphRelationshipType;
  readonly metadata: Readonly<Record<string, string>>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type KnowledgeGraphSummary = {
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly nodesByType: Readonly<Record<string, number>>;
  readonly edgesByType: Readonly<Record<string, number>>;
  readonly recentNodes: readonly KnowledgeGraphNode[];
  readonly recentEdges: readonly KnowledgeGraphEdge[];
};

export type KnowledgeGraphQuery = {
  readonly organizationId: string;
  readonly nodeType?: KnowledgeGraphNodeType | "";
  readonly relationshipType?: KnowledgeGraphRelationshipType | "";
};

export type ConnectedEvidenceResult = {
  readonly node: KnowledgeGraphNode;
  readonly evidenceNodes: readonly KnowledgeGraphNode[];
  readonly edges: readonly KnowledgeGraphEdge[];
};
