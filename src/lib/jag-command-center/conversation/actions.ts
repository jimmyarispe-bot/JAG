"use server";

/**
 * Server actions for Executive Conversation — Sprint 203.
 */

import { revalidatePath } from "next/cache";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { askExecutiveConversation } from "./engine";
import {
  archiveConversation,
  createConversation,
  pinConversation,
  renameConversation,
} from "./store";

function requireSession() {
  return getJagPlatformSession();
}

export async function jagAskConversationAction(input: {
  question: string;
  conversationId?: string | null;
  organizationId?: string | null;
}) {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" as const };
  const q = input.question.trim();
  if (!q) return { error: "Question required" as const };

  const result = askExecutiveConversation({
    session,
    question: q,
    conversationId: input.conversationId,
    organizationId: input.organizationId,
  });
  revalidatePath("/jag/chat");
  return {
    conversationId: result.conversation.id,
    conversation: result.conversation,
    answer: result.answer,
    intent: result.intent,
    durationMs: result.durationMs,
    observationId: result.observationId,
    chunks: result.answer
      ? [
          result.answer.executiveSummary,
          result.answer.confidenceExplanation,
          ...result.answer.recommendedNextActions.map((a) => `Next: ${a}`),
        ]
      : [],
  };
}

export async function jagCreateConversationAction(input?: {
  organizationId?: string | null;
  organizationName?: string | null;
  title?: string;
}) {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" as const };
  const record = createConversation({
    organizationId: input?.organizationId ?? null,
    organizationName: input?.organizationName ?? null,
    title: input?.title,
  });
  revalidatePath("/jag/chat");
  return { conversation: record };
}

export async function jagRenameConversationAction(input: {
  id: string;
  title: string;
}) {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" as const };
  const record = renameConversation(input.id, input.title);
  if (!record) return { error: "Not found" as const };
  revalidatePath("/jag/chat");
  return { conversation: record };
}

export async function jagPinConversationAction(input: {
  id: string;
  pinned: boolean;
}) {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" as const };
  const record = pinConversation(input.id, input.pinned);
  if (!record) return { error: "Not found" as const };
  revalidatePath("/jag/chat");
  return { conversation: record };
}

export async function jagArchiveConversationAction(input: {
  id: string;
  archived: boolean;
}) {
  const session = await requireSession();
  if (!session) return { error: "Unauthorized" as const };
  const record = archiveConversation(input.id, input.archived);
  if (!record) return { error: "Not found" as const };
  revalidatePath("/jag/chat");
  return { conversation: record };
}
