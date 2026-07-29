/**
 * Conversation turn observability — Sprint 203.
 */

export type ConversationObservation = {
  readonly id: string;
  readonly conversationId: string;
  readonly organizationId: string | null;
  readonly question: string;
  readonly intent: string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly evidenceIds: readonly string[];
  readonly contributorsConsulted: readonly string[];
  readonly confidence: number;
  readonly relatedObjectIds: readonly string[];
  readonly insufficientData: boolean;
};

const MAX = 200;
const observations: ConversationObservation[] = [];

export function recordConversationObservation(obs: ConversationObservation): void {
  observations.unshift(obs);
  if (observations.length > MAX) observations.length = MAX;
}

export function listConversationObservations(
  limit = 50
): readonly ConversationObservation[] {
  return observations.slice(0, limit);
}

export function clearConversationObservationsForTests(): void {
  observations.length = 0;
}
