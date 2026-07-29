/**
 * Shared contributor execution context.
 */

import type { CognitiveThinkRequest } from "@/lib/jag/runtime";
import type { EducationEvidenceItem } from "./EducationEvidenceBuilder";
import type { EducationReadiness } from "./EducationContributorResult";

export interface EducationContributorContext<TObservation> {
  contributorId: string;
  observation: TObservation;
  evidenceSource: string;
  topicId: string;
  request?: CognitiveThinkRequest;
  now?: string;
}

export interface EducationAnalysisContext<TObservation>
  extends EducationContributorContext<TObservation> {
  evidence: readonly EducationEvidenceItem[];
  blockingIssues: readonly string[];
  warnings: readonly string[];
  readiness: EducationReadiness;
  confidence: number;
}
