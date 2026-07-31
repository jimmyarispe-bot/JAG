import {
  buildDecisionMergeKey,
  countByStatus,
  createDecisionId,
  defaultOwnerForPriority,
  dueDateFrom,
} from "@/lib/platform/decisions/decision";
import { appendHistory } from "@/lib/platform/decisions/history";
import { buildOwner } from "@/lib/platform/decisions/ownership";
import type {
  DecisionQueue,
  PlatformDecision,
  SyncRecommendationsInput,
} from "@/lib/platform/decisions/types";
import { defaultDueDateForPriority } from "@/lib/platform/notifications/due-dates";
import {
  DecisionRepository,
  OperationalPersistence,
} from "@/lib/platform/persistence";

/** @deprecated use DecisionRepository — kept for test reset naming. */
export function resetDecisionStoreForTests(): void {
  OperationalPersistence.resetForTests();
}

export function getStoredDecision(id: string): PlatformDecision | null {
  return DecisionRepository.getById(id);
}

export function upsertStoredDecision(decision: PlatformDecision): void {
  DecisionRepository.upsert(decision);
}

export function listStoredDecisions(organizationId?: string | null): PlatformDecision[] {
  return DecisionRepository.list(organizationId);
}

/**
 * Convert recommendations into pending decisions.
 * Matching mergeKey updates the existing active decision (no duplicates).
 */
export function syncRecommendationsToQueue(
  input: SyncRecommendationsInput
): DecisionQueue {
  const now = input.now ?? new Date().toISOString();
  const dueInDays = input.dueInDays;
  const defaultRole = input.defaultOwnerRole;

  for (const rec of input.recommendations) {
    const mergeKey = buildDecisionMergeKey({
      organizationId: input.organizationId,
      recommendationId: rec.id,
    });
    const sourceInsightId = rec.insightIds[0] ?? null;
    const insightStatement =
      (sourceInsightId && input.insightsById?.[sourceInsightId]?.statement) ||
      null;
    const title = rec.action;
    const description =
      insightStatement ??
      `Recommended action from ${rec.domain} intelligence (${rec.priority}).`;

    const existing = DecisionRepository.findActiveByMergeKey(mergeKey);
    if (existing) {
      const updated: PlatformDecision = {
        ...existing,
        title,
        description,
        priority: rec.priority,
        sourceInsightId,
        sourceRecommendationId: rec.id,
        signalIds: [...rec.signalIds],
        applicationId: input.applicationId ?? existing.applicationId,
        updatedAt: now,
        dueDate:
          existing.dueDate ??
          (dueInDays != null
            ? dueDateFrom(now, dueInDays)
            : defaultDueDateForPriority(rec.priority, now)),
        history: appendHistory(existing.history, {
          action: "updated_from_recommendation",
          actorUserId: input.actorUserId,
          timestamp: now,
          reason: "Synced from Executive Intelligence recommendation",
          toStatus: existing.status,
        }),
      };
      DecisionRepository.upsert(updated);
      continue;
    }

    const ownerRole = defaultRole ?? defaultOwnerForPriority(rec.priority);
    const createdAt = now;
    const id = createDecisionId(mergeKey, createdAt);
    const decision: PlatformDecision = {
      id,
      mergeKey,
      sourceInsightId,
      sourceRecommendationId: rec.id,
      signalIds: [...rec.signalIds],
      title,
      description,
      organizationId: input.organizationId,
      applicationId: input.applicationId ?? null,
      priority: rec.priority,
      owner: buildOwner({ role: ownerRole }),
      status: "open",
      createdAt,
      updatedAt: now,
      dueDate:
        dueInDays != null
          ? dueDateFrom(now, dueInDays)
          : defaultDueDateForPriority(rec.priority, now),
      completedAt: null,
      outcome: null,
      history: appendHistory([], {
        action: "created",
        actorUserId: input.actorUserId,
        timestamp: now,
        reason: "Created from Executive Intelligence recommendation",
        toStatus: "open",
        toOwnerRole: ownerRole,
      }),
    };
    DecisionRepository.upsert(decision);
  }

  const decisions = DecisionRepository.list(input.organizationId);
  return {
    organizationId: input.organizationId,
    decisions,
    counts: countByStatus(decisions),
    syncedAt: now,
  };
}

export function getDecisionQueue(organizationId?: string | null): DecisionQueue {
  const decisions = DecisionRepository.list(organizationId);
  return {
    organizationId: organizationId ?? null,
    decisions,
    counts: countByStatus(decisions),
    syncedAt: new Date().toISOString(),
  };
}
