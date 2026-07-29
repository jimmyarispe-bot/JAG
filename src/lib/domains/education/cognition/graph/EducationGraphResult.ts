/**
 * Unified Education cognitive result from the Intelligence Graph.
 */

import type { CognitiveEvidenceRef } from "@/lib/jag/runtime";
import type {
  EducationActionProposal,
  EducationConstitutionalTrace,
  EducationReadiness,
} from "../framework";
import type { EducationGraphEdge } from "./EducationGraphEdge";
import type { EducationGraphNode } from "./EducationGraphNode";

export interface EducationGraphEvidenceItem {
  ref: CognitiveEvidenceRef;
  /** Contributors that produced this evidence id. */
  originContributorIds: readonly string[];
}

export interface EducationGraphRecommendation {
  id: string;
  kind: string;
  title: string;
  explanation: string;
  confidence: number;
  priority: number;
  evidenceIds: readonly string[];
  suggestedActions: readonly EducationActionProposal[];
  /** Origin contributor(s) after merge / conflict resolution. */
  originContributorIds: readonly string[];
  /** Node kinds that contributed. */
  originNodeKinds: readonly string[];
  constitutionalTrace: EducationConstitutionalTrace;
  /** Conflict markers when recommendations were reconciled. */
  conflictFlags: readonly string[];
  attributes?: Readonly<Record<string, unknown>>;
}

export interface EducationGraphConflict {
  id: string;
  kind:
    | "conflicting_recommendations"
    | "duplicate_recommendations"
    | "contradictory_priorities"
    | "overlapping_evidence";
  summary: string;
  recommendationIds: readonly string[];
  contributorIds: readonly string[];
}

export interface EducationGraphResult {
  subjectId: string;
  readiness: EducationReadiness;
  confidence: number;
  priority: number;
  explanation: string;
  evidence: readonly EducationGraphEvidenceItem[];
  recommendations: readonly EducationGraphRecommendation[];
  suggestedActions: readonly EducationActionProposal[];
  blockingIssues: readonly string[];
  warnings: readonly string[];
  conflicts: readonly EducationGraphConflict[];
  nodes: readonly EducationGraphNode[];
  edges: readonly EducationGraphEdge[];
  consultedContributorIds: readonly string[];
  analyzedAt: string;
  attributes?: Readonly<Record<string, unknown>>;
}
