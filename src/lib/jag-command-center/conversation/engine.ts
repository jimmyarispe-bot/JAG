/**
 * Executive Conversation engine — route → ground → structured answer.
 */

import { recordJagAuditEvent } from "../audit/store";
import { sessionCanAccessConversation } from "./access";
import { buildConversationAnswer } from "./answer";
import { gatherConversationContext } from "./context";
import { intentToMemoryTopic, routeConversationIntent } from "./intents";
import { recordConversationObservation } from "./observability";
import {
  createConversation,
  getConversation,
  saveConversation,
} from "./store";
import type {
  JagConversationAnswer,
  JagConversationRecord,
  JagConversationTurn,
} from "./types";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

export type AskConversationInput = {
  readonly session: JagPlatformSession;
  readonly conversationId?: string | null;
  readonly question: string;
  readonly organizationId?: string | null;
};

export type AskConversationResult = {
  readonly conversation: JagConversationRecord;
  readonly answer: JagConversationAnswer;
  readonly intent: string;
  readonly durationMs: number;
  readonly observationId: string;
};

let turnSeq = 0;

export function askExecutiveConversation(
  input: AskConversationInput
): AskConversationResult {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const question = input.question.trim();

  const existing = input.conversationId
    ? getConversation(input.conversationId)
    : null;
  // Defense in depth: never append turns to an inaccessible conversation.
  const accessibleExisting =
    existing && sessionCanAccessConversation(input.session, existing)
      ? existing
      : null;

  let conversation =
    accessibleExisting ??
    createConversation({
      organizationId:
        input.organizationId ??
        (input.session.authority === "organization"
          ? input.session.organizationId
          : null),
      organizationName: null,
      title: question.slice(0, 64) || "New conversation",
    });

  const context = gatherConversationContext(
    input.session,
    input.organizationId ?? conversation.organizationId
  );

  if (!conversation.organizationId && context.organizationId) {
    conversation = saveConversation({
      ...conversation,
      organizationId: context.organizationId,
      organizationName: context.organizationName,
    });
  }

  const routed = routeConversationIntent(question, conversation.memoryTopics);
  const answer = buildConversationAnswer({
    question,
    routed,
    context,
    priorTopics: conversation.memoryTopics,
  });

  const durationMs = Date.now() - started;
  const finishedAt = new Date().toISOString();

  const userTurn: JagConversationTurn = {
    id: `turn-${++turnSeq}-u`,
    role: "executive",
    at: startedAt,
    content: question,
  };
  const jagTurn: JagConversationTurn = {
    id: `turn-${turnSeq}-j`,
    role: "jag",
    at: finishedAt,
    content: answer.executiveSummary,
    intent: routed.intent,
    answer,
    durationMs,
  };

  const topic = intentToMemoryTopic(routed.intent);
  const memoryTopics = topic
    ? [...conversation.memoryTopics.filter((t) => t !== topic), topic].slice(-8)
    : conversation.memoryTopics;
  const memoryEntityIds = [
    ...conversation.memoryEntityIds,
    ...answer.relatedDecisions.map((d) => d.id),
    ...answer.forecasts.map((f) => f.id),
  ].slice(-40);

  const title =
    conversation.turns.length === 0 && conversation.title === "New conversation"
      ? question.slice(0, 64)
      : conversation.title;

  conversation = saveConversation({
    ...conversation,
    title,
    turns: [...conversation.turns, userTurn, jagTurn],
    memoryTopics,
    memoryEntityIds,
  });

  const observationId = `cobs-${Date.now()}-${turnSeq}`;
  recordConversationObservation({
    id: observationId,
    conversationId: conversation.id,
    organizationId: conversation.organizationId,
    question,
    intent: routed.intent,
    startedAt,
    finishedAt,
    durationMs,
    evidenceIds: answer.evidence.map((e) => e.id),
    contributorsConsulted: answer.supportingContributors,
    confidence: answer.confidence,
    relatedObjectIds: [
      ...answer.relatedDecisions.map((d) => d.id),
      ...answer.forecasts.map((f) => f.id),
      ...answer.scenarios.map((s) => s.id),
    ],
    insufficientData: answer.insufficientData,
  });

  recordJagAuditEvent({
    action: "conversation_turn",
    actorUserId: input.session.userId,
    actorLabel: input.session.displayName,
    organizationId: conversation.organizationId,
    detail: `Conversation ${conversation.id}: intent ${routed.intent}, ${durationMs}ms, confidence ${(answer.confidence * 100).toFixed(0)}%.`,
    metadata: {
      observationId,
      conversationId: conversation.id,
      intent: routed.intent,
    },
  });

  return {
    conversation,
    answer,
    intent: routed.intent,
    durationMs,
    observationId,
  };
}

/** Serialize answer into streamable chunks for progressive UI. */
export function chunkAnswerForStream(answer: JagConversationAnswer): string[] {
  return [
    answer.executiveSummary,
    answer.confidenceExplanation,
    ...answer.primaryDrivers.map((d) => `${d.label}: ${d.explanation}`),
    ...answer.evidence.slice(0, 4).map((e) => `Evidence — ${e.source}: ${e.summary}`),
    ...answer.recommendedNextActions.map((a) => `Next: ${a}`),
    ...answer.suggestedFollowUps.map((q) => `Follow-up: ${q}`),
  ].filter(Boolean);
}
