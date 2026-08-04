/**
 * Conversation resource ACL — bind reads/mutations to session org scope.
 */

import { sessionCanAccessOrganization } from "@/lib/jag-platform/org-context";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { getConversation } from "./store";
import type { JagConversationRecord } from "./types";

/**
 * Whether the session may read/mutate a conversation record.
 * Org operators: bound org only (null-bound conversations denied).
 * Platform stewards: any bound org + unbound conversations.
 */
export function sessionCanAccessConversation(
  session: JagPlatformSession,
  conversation: Pick<JagConversationRecord, "organizationId">
): boolean {
  if (!conversation.organizationId) {
    return session.authority === "platform";
  }
  return sessionCanAccessOrganization(session, conversation.organizationId);
}

/** Load + ACL gate. Returns null when missing or inaccessible (fail closed). */
export function getAccessibleConversation(
  session: JagPlatformSession,
  conversationId: string
): JagConversationRecord | null {
  const record = getConversation(conversationId);
  if (!record) return null;
  if (!sessionCanAccessConversation(session, record)) return null;
  return record;
}
