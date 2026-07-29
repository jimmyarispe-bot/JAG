/**
 * Load Executive Conversation workspace model.
 */

import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { getConversation, listConversations } from "./store";
import { SUGGESTED_PROMPTS } from "./types";
import type { JagConversationListItem, JagConversationRecord } from "./types";

export type JagConversationWorkspaceModel = {
  readonly organizationId: string | null;
  readonly organizationName: string | null;
  readonly organizations: readonly { id: string; label: string }[];
  readonly conversations: readonly JagConversationListItem[];
  readonly active: JagConversationRecord | null;
  readonly suggestedPrompts: readonly string[];
  readonly advisoryNotice: string;
};

export function loadConversationWorkspace(
  session: JagPlatformSession,
  options?: {
    readonly organizationId?: string;
    readonly conversationId?: string;
    readonly search?: string;
    readonly includeArchived?: boolean;
  }
): JagConversationWorkspaceModel {
  const orgs = listOrganizationsForSession(session);
  const org =
    orgs.find((o) => o.id === options?.organizationId) ?? orgs[0] ?? null;
  const conversations = listConversations({
    query: options?.search,
    includeArchived: options?.includeArchived,
  });
  const active = options?.conversationId
    ? getConversation(options.conversationId)
    : null;

  return {
    organizationId: org?.id ?? null,
    organizationName: org?.name ?? null,
    organizations: orgs.map((o) => ({ id: o.id, label: o.name })),
    conversations,
    active,
    suggestedPrompts: [...SUGGESTED_PROMPTS],
    advisoryNotice:
      "Executive Conversation — evidence-backed answers only. Not a chatbot. Unbound signals are never fabricated.",
  };
}
