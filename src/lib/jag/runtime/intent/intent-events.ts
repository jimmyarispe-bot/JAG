export const INTENT_EVENT_TYPES = {
  INTENT_RESOLVED: "jag.runtime.intent.resolved",
  INTENT_CHANGED: "jag.runtime.intent.changed",
  INTENT_EXPIRED: "jag.runtime.intent.expired",
  INTENT_CONFLICT_DETECTED: "jag.runtime.intent.conflict_detected",
  INTENT_CONFIDENCE_CHANGED: "jag.runtime.intent.confidence_changed",
  INTENT_RESOLUTION_FAILED: "jag.runtime.intent.resolution_failed",
} as const;

export type IntentEventType =
  (typeof INTENT_EVENT_TYPES)[keyof typeof INTENT_EVENT_TYPES];

export interface IntentResolvedPayload {
  intentId: string;
  confidence: number;
  source: string;
  requiresClarification: boolean;
}

export interface IntentChangedPayload {
  fromIntentId: string | null;
  toIntentId: string;
  confidence: number;
}

export interface IntentExpiredPayload {
  intentId: string;
  expiredAt: string;
}

export interface IntentConflictDetectedPayload {
  winnerIntentId: string;
  conflictIntentIds: readonly string[];
}

export interface IntentConfidenceChangedPayload {
  intentId: string;
  from: number;
  to: number;
}

export interface IntentResolutionFailedPayload {
  reason: string;
  code: string;
}
