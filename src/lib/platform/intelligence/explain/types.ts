/**
 * Explainability & Intelligence Graph — Sprint 208.
 * Application-layer reasoning explorer. Not a graph database.
 * Does not modify Core or Runtime.
 */

export const EXPLAIN_NODE_KINDS = [
  "evidence",
  "knowledge",
  "policy",
  "contributor",
  "forecast",
  "scenario",
  "memory",
  "goal",
  "initiative",
  "decision",
  "execution",
  "outcome",
  "watcher_alert",
  "briefing",
  "conversation",
  "capability",
  "organization",
] as const;

export type ExplainNodeKind = (typeof EXPLAIN_NODE_KINDS)[number];

export const EXPLAIN_EDGE_KINDS = [
  "supports",
  "derived_from",
  "references",
  "depends_on",
  "influences",
  "produces",
  "related_to",
  "triggered_by",
  "aligns_with",
] as const;

export type ExplainEdgeKind = (typeof EXPLAIN_EDGE_KINDS)[number];

export type ExplainEvidenceRef = {
  readonly id: string;
  readonly source: string;
  readonly summary: string;
  readonly freshness?: string;
  readonly strength?: number;
};

export type ExplainTimelineEntry = {
  readonly at: string;
  readonly message: string;
  readonly kind?: string;
};

export type ExplainConfidence = {
  readonly score: number;
  readonly band: "low" | "moderate" | "high" | "none";
  readonly evidenceStrength: number;
  readonly dataFreshness: "fresh" | "aging" | "stale" | "unknown";
  readonly assumptionCount: number;
  readonly missingInformation: readonly string[];
  readonly explanation: string;
};

export type ExplainNode = {
  readonly id: string;
  readonly kind: ExplainNodeKind;
  readonly label: string;
  readonly summary: string;
  readonly description?: string;
  readonly organizationId: string | null;
  readonly createdBy?: string;
  readonly createdAt?: string;
  readonly confidence?: number;
  readonly href?: string;
  readonly tags?: readonly string[];
  readonly metadata?: Readonly<Record<string, string>>;
};

export type ExplainEdge = {
  readonly id: string;
  readonly kind: ExplainEdgeKind;
  readonly fromId: string;
  readonly toId: string;
  readonly label: string;
  readonly weight?: number;
};

export type ReasoningStep = {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly detail: string;
  readonly nodeIds: readonly string[];
};

export type Explanation = {
  readonly id: string;
  readonly subjectId: string;
  readonly subjectKind: ExplainNodeKind;
  readonly title: string;
  readonly summary: string;
  readonly organizationId: string | null;
  readonly reasoningChain: readonly ReasoningStep[];
  readonly evidence: readonly ExplainEvidenceRef[];
  readonly policies: readonly string[];
  readonly forecasts: readonly string[];
  readonly scenarios: readonly string[];
  readonly memory: readonly string[];
  readonly goals: readonly string[];
  readonly decisions: readonly string[];
  readonly outcomes: readonly string[];
  readonly contributors: readonly string[];
  readonly assumptions: readonly string[];
  readonly confidence: ExplainConfidence;
  readonly timeline: readonly ExplainTimelineEntry[];
  readonly relatedNodeIds: readonly string[];
  readonly generatedAt: string;
  readonly advisoryNotice: string;
  readonly cached: boolean;
};

export type GraphQuery = {
  readonly organizationId?: string;
  readonly q?: string;
  readonly kinds?: readonly ExplainNodeKind[];
  readonly capabilityId?: string;
  readonly fromDate?: string;
  readonly toDate?: string;
  readonly focusNodeId?: string;
  readonly depth?: number;
  readonly limit?: number;
};

export type ExplainGraph = {
  readonly nodes: readonly ExplainNode[];
  readonly edges: readonly ExplainEdge[];
  readonly focusNodeId: string | null;
  readonly breadcrumb: readonly { id: string; label: string }[];
  readonly truncated: boolean;
  readonly advisoryNotice: string;
};
