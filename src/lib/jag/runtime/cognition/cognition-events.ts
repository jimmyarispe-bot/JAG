export const COGNITION_EVENT_TYPES = {
  EVIDENCE_COLLECTED: "jag.runtime.cognition.evidence_collected",
  REASONING_COMPLETED: "jag.runtime.cognition.reasoning_completed",
  RECOMMENDATION_GENERATED: "jag.runtime.cognition.recommendation_generated",
  CONFLICT_DETECTED: "jag.runtime.cognition.conflict_detected",
  CONFIDENCE_CHANGED: "jag.runtime.cognition.confidence_changed",
  PROVIDER_FAILED: "jag.runtime.cognition.provider_failed",
} as const;

export type CognitionEventType =
  (typeof COGNITION_EVENT_TYPES)[keyof typeof COGNITION_EVENT_TYPES];

export interface EvidenceCollectedPayload {
  count: number;
  providerIds: readonly string[];
}

export interface ReasoningCompletedPayload {
  briefId: string;
  recommendationCount: number;
  unknownGapCount: number;
}

export interface RecommendationGeneratedPayload {
  recommendationId: string;
  providerId: string;
  confidence: number;
}

export interface ConflictDetectedPayload {
  conflictId: string;
  recommendationIds: readonly string[];
}

export interface ConfidenceChangedPayload {
  subjectId: string;
  from: number;
  to: number;
}

export interface ProviderFailedPayload {
  providerId: string;
  reason: string;
}
