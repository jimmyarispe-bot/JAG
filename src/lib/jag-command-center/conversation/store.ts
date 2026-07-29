/**
 * In-memory conversation store — pin, archive, rename, search.
 */

import type { JagConversationListItem, JagConversationRecord } from "./types";

const byId = new Map<string, JagConversationRecord>();
let seq = 0;

export function resetJagConversationStoreForTests(): void {
  byId.clear();
  seq = 0;
}

export function createConversation(input: {
  organizationId: string | null;
  organizationName: string | null;
  title?: string;
}): JagConversationRecord {
  const now = new Date().toISOString();
  const id = `conv-${++seq}-${Date.now()}`;
  const record: JagConversationRecord = {
    id,
    title: input.title?.trim() || "New conversation",
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    createdAt: now,
    updatedAt: now,
    pinned: false,
    archived: false,
    turns: [],
    memoryTopics: [],
    memoryEntityIds: [],
  };
  byId.set(id, record);
  return record;
}

export function getConversation(id: string): JagConversationRecord | null {
  return byId.get(id) ?? null;
}

export function saveConversation(record: JagConversationRecord): JagConversationRecord {
  const next = { ...record, updatedAt: new Date().toISOString() };
  byId.set(next.id, next);
  return next;
}

export function listConversations(options?: {
  includeArchived?: boolean;
  query?: string;
}): readonly JagConversationListItem[] {
  const q = options?.query?.trim().toLowerCase() ?? "";
  let items = [...byId.values()];
  if (!options?.includeArchived) {
    items = items.filter((c) => !c.archived);
  }
  if (q) {
    items = items.filter((c) => {
      const hay = [
        c.title,
        ...c.turns.map((t) => t.content),
        c.organizationName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }
  items.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
  return items.map((c) => ({
    id: c.id,
    title: c.title,
    updatedAt: c.updatedAt,
    pinned: c.pinned,
    archived: c.archived,
    preview:
      c.turns.length > 0
        ? c.turns[c.turns.length - 1]!.content.slice(0, 120)
        : "No turns yet",
    turnCount: c.turns.length,
  }));
}

export function renameConversation(id: string, title: string): JagConversationRecord | null {
  const c = byId.get(id);
  if (!c) return null;
  return saveConversation({ ...c, title: title.trim() || c.title });
}

export function pinConversation(id: string, pinned: boolean): JagConversationRecord | null {
  const c = byId.get(id);
  if (!c) return null;
  return saveConversation({ ...c, pinned });
}

export function archiveConversation(
  id: string,
  archived: boolean
): JagConversationRecord | null {
  const c = byId.get(id);
  if (!c) return null;
  return saveConversation({ ...c, archived, pinned: archived ? false : c.pinned });
}
