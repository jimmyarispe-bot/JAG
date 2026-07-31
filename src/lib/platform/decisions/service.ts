import {
  assignDecision,
  createDecision,
  escalateDecisionPriority,
  setDecisionDueDate,
  transitionDecision,
} from "@/lib/platform/decisions/actions";
import {
  getDecisionQueue,
  getStoredDecision,
  syncRecommendationsToQueue,
} from "@/lib/platform/decisions/queue";
import { ownerLabel } from "@/lib/platform/decisions/ownership";
import type {
  AssignDecisionInput,
  CreateDecisionInput,
  DecisionQueue,
  EscalateDecisionPriorityInput,
  PlatformDecision,
  SetDecisionDueDateInput,
  SyncRecommendationsInput,
  TransitionDecisionInput,
} from "@/lib/platform/decisions/types";
import type { ExecutiveIntelligenceResult } from "@/lib/platform/intelligence/executive-layer/types";
import { isDecisionOverdue } from "@/lib/platform/notifications/assignment";

/**
 * Platform Decision Service — execution layer over Executive Intelligence.
 * Assignment creates in-app notifications (Sprint 067).
 * Automation may create/escalate decisions (Sprint 068).
 */
export const DecisionService = {
  /** Sync EI recommendations into the decision queue (create or update). */
  syncFromIntelligence(
    intelligence: ExecutiveIntelligenceResult,
    options?: {
      applicationId?: string | null;
      actorUserId?: string | null;
      now?: string;
    }
  ): DecisionQueue {
    const insightsById = Object.fromEntries(
      intelligence.priorities.map((p) => [p.id, { statement: p.statement }])
    );

    return syncRecommendationsToQueue({
      organizationId: intelligence.organizationId,
      applicationId: options?.applicationId ?? "academyos",
      recommendations: intelligence.recommendations,
      insightsById,
      actorUserId: options?.actorUserId,
      now: options?.now ?? intelligence.generatedAt,
    });
  },

  syncRecommendations(input: SyncRecommendationsInput): DecisionQueue {
    return syncRecommendationsToQueue(input);
  },

  /** Create by merge key; returns existing active decision when already present. */
  create(input: CreateDecisionInput): { decision: PlatformDecision; created: boolean } {
    return createDecision(input);
  },

  getQueue(organizationId?: string | null): DecisionQueue {
    return getDecisionQueue(organizationId);
  },

  getById(decisionId: string): PlatformDecision | null {
    return getStoredDecision(decisionId);
  },

  assign(input: AssignDecisionInput): PlatformDecision {
    return assignDecision(input);
  },

  setDueDate(input: SetDecisionDueDateInput): PlatformDecision {
    return setDecisionDueDate(input);
  },

  escalatePriority(input: EscalateDecisionPriorityInput): PlatformDecision {
    return escalateDecisionPriority(input);
  },

  isOverdue(decision: PlatformDecision, now?: string): boolean {
    return isDecisionOverdue(decision, now);
  },

  transition(input: TransitionDecisionInput): PlatformDecision {
    return transitionDecision(input);
  },

  ownerLabel,
} as const;

export type DecisionServiceApi = typeof DecisionService;
