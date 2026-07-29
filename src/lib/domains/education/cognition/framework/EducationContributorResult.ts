/**
 * Normalized result shape for Education cognitive contributors.
 */

import type { CognitiveEvidenceRef } from "@/lib/jag/runtime";
import type { EducationConstitutionalTrace } from "./EducationTrace";

export interface EducationActionProposal {
  kind: string;
  actionId: string;
  label: string;
  priority: number;
  rationale: string;
}

export interface EducationRecommendation {
  id: string;
  kind: string;
  title: string;
  explanation: string;
  confidence: number;
  priority: number;
  evidenceIds: readonly string[];
  suggestedActions: readonly EducationActionProposal[];
  constitutionalTrace: EducationConstitutionalTrace;
  attributes?: Readonly<Record<string, unknown>>;
}

export type EducationReadiness = "ready" | "blocked" | "conditional";

export interface EducationContributorResult {
  /** Primary subject id (enrollment request, student, etc.). */
  subjectId: string;
  evidence: readonly CognitiveEvidenceRef[];
  recommendations: readonly EducationRecommendation[];
  confidence: number;
  explanation: string;
  priority: number;
  blockingIssues: readonly string[];
  warnings: readonly string[];
  suggestedActions: readonly EducationActionProposal[];
  readiness: EducationReadiness;
  analyzedAt: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export function flattenEducationActionProposals(
  recommendations: readonly EducationRecommendation[]
): EducationActionProposal[] {
  const seen = new Set<string>();
  const out: EducationActionProposal[] = [];
  for (const rec of recommendations) {
    for (const proposal of rec.suggestedActions) {
      if (seen.has(proposal.actionId)) continue;
      seen.add(proposal.actionId);
      out.push(proposal);
    }
  }
  return out.sort((a, b) => a.priority - b.priority);
}
