/**
 * Session memory for executive conversation (in-process / request-scoped).
 */

import type { CopilotIntent, SessionMemory } from "../types";

const MAX_QUESTIONS = 20;
const MAX_DECISIONS = 12;
const MAX_ACTIONS = 12;

export function createSessionMemory(input: {
  sessionId?: string;
  organizationId: string;
  executiveRole?: string;
}): SessionMemory {
  const now = new Date().toISOString();
  return {
    sessionId: input.sessionId ?? `copilot-${Date.now()}`,
    organizationId: input.organizationId,
    executiveRole: input.executiveRole ?? "CEO",
    createdAt: now,
    updatedAt: now,
    recentQuestions: [],
    currentDecisions: [],
    pendingActions: [],
    lastRecommendationId: null,
    lastIntent: null,
  };
}

export function rememberQuestion(memory: SessionMemory, question: string): SessionMemory {
  return {
    ...memory,
    updatedAt: new Date().toISOString(),
    recentQuestions: [question, ...memory.recentQuestions].slice(0, MAX_QUESTIONS),
  };
}

export function rememberIntent(memory: SessionMemory, intent: CopilotIntent): SessionMemory {
  return { ...memory, updatedAt: new Date().toISOString(), lastIntent: intent };
}

export function rememberRecommendation(
  memory: SessionMemory,
  recommendationId: string | null,
  pendingAction?: string
): SessionMemory {
  return {
    ...memory,
    updatedAt: new Date().toISOString(),
    lastRecommendationId: recommendationId,
    pendingActions: pendingAction
      ? [pendingAction, ...memory.pendingActions].slice(0, MAX_ACTIONS)
      : memory.pendingActions,
  };
}

export function rememberDecision(memory: SessionMemory, decision: string): SessionMemory {
  return {
    ...memory,
    updatedAt: new Date().toISOString(),
    currentDecisions: [decision, ...memory.currentDecisions].slice(0, MAX_DECISIONS),
  };
}

export function applyTurnMemory(
  memory: SessionMemory,
  question: string,
  intent: CopilotIntent,
  recommendationId: string | null,
  suggestedAction?: string,
  decisionLabel?: string
): SessionMemory {
  let next = rememberQuestion(memory, question);
  next = rememberIntent(next, intent);
  next = rememberRecommendation(next, recommendationId, suggestedAction);
  if (decisionLabel) next = rememberDecision(next, decisionLabel);
  return next;
}
