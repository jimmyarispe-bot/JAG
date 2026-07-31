/**
 * Evidence Graph contracts — references to organizational artifacts only.
 * The graph organizes relationships; it does not own underlying data.
 */

import type { Evidence } from "@/jag/intelligence/contracts/evidence";
import type { OrganizationalEvidenceKind } from "@/jag/intelligence/evidence/reference-kinds";
import type { EvidencePriority } from "@/jag/intelligence/evidence/priority";

export type EvidenceNodeId = string;

export type EvidenceNode = {
  readonly id: EvidenceNodeId;
  readonly kind: OrganizationalEvidenceKind;
  readonly refId: string;
  readonly label?: string;
  readonly summary?: string;
  readonly priority: EvidencePriority;
  /** EI Evidence contract ids that cite this artifact. */
  readonly evidenceIds: readonly string[];
  readonly correlationKey?: string;
  readonly sourceCapabilityIds?: readonly string[];
};

export type EvidenceEdgeType =
  | "work_to_decision"
  | "decision_to_policy"
  | "policy_to_report"
  | "report_to_analytics"
  | "analytics_to_recommendation"
  | "related"
  | "supports";

/** Logical sinks that are not organizational evidence nodes. */
export type EvidenceCorrelationSink = "recommendation";

export type EvidenceEdge = {
  readonly id: string;
  readonly type: EvidenceEdgeType;
  readonly fromNodeId: EvidenceNodeId;
  readonly toNodeId?: EvidenceNodeId;
  readonly toSink?: EvidenceCorrelationSink;
  readonly ruleId: string;
  readonly explanation: string;
};

export type EvidenceCorrelation = {
  readonly id: string;
  readonly ruleId: string;
  readonly fromKind: OrganizationalEvidenceKind;
  readonly toKind?: OrganizationalEvidenceKind;
  readonly toSink?: EvidenceCorrelationSink;
  readonly fromNodeId: EvidenceNodeId;
  readonly toNodeId?: EvidenceNodeId;
  readonly edgeId: string;
  readonly explanation: string;
};

export type EvidenceGraph = {
  readonly id: string;
  readonly organizationId?: string;
  readonly nodes: readonly EvidenceNode[];
  readonly edges: readonly EvidenceEdge[];
  readonly correlations: readonly EvidenceCorrelation[];
  /** Edges skipped to preserve acyclicity (deterministic). */
  readonly skippedCycleEdges: readonly EvidenceEdge[];
};

/**
 * Curated bundle handed to a provider — already correlated.
 * Providers must not discover evidence; they receive this graph.
 */
export type EvidenceBundle = {
  readonly id: string;
  readonly graph: EvidenceGraph;
  /** Flattened EI Evidence contracts derived from graph nodes. */
  readonly evidence: readonly Evidence[];
  readonly orderedNodeIds: readonly EvidenceNodeId[];
};

export type DeclaredEvidenceLink = {
  readonly fromRefId: string;
  readonly toRefId: string;
  /** Optional rule override; otherwise inferred from kinds. */
  readonly ruleId?: string;
};

export type EvidenceCollectorSeed = Evidence & {
  readonly correlationKey?: string;
  readonly priority?: EvidencePriority;
};

export type EvidenceCollectorInput = {
  readonly graphId?: string;
  readonly organizationId?: string;
  readonly seeds: readonly EvidenceCollectorSeed[];
  readonly declaredLinks?: readonly DeclaredEvidenceLink[];
};
