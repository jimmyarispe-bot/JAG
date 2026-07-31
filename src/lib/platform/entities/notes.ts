import {
  assertEntityTypeRegistered,
  entityHasCapability,
} from "@/lib/platform/entities/registry";
import type { EntityNote } from "@/lib/platform/entities/types";

const noteStore = new Map<string, EntityNote>();
let noteSeq = 0;

export function resetEntityNotesForTests(): void {
  noteStore.clear();
  noteSeq = 0;
}

/** Extract future-ready `@user:{id}` mention tokens from note body. */
export function extractMentionUserIds(body: string): string[] {
  const matches = body.matchAll(/@user:([A-Za-z0-9_-]+)/g);
  return [...new Set([...matches].map((m) => m[1]!))];
}

export function addEntityNote(input: {
  entityType: string;
  entityId: string;
  body: string;
  organizationId?: string | null;
  authorUserId?: string | null;
  pinned?: boolean;
  metadata?: Record<string, unknown>;
  now?: string;
}): EntityNote {
  assertEntityTypeRegistered(input.entityType);
  if (!entityHasCapability(input.entityType, "notes")) {
    throw new Error(`Entity type "${input.entityType}" does not enable notes`);
  }
  const now = input.now ?? new Date().toISOString();
  noteSeq += 1;
  const note: EntityNote = {
    id: `ent-note:${noteSeq}:${now}`,
    entityType: input.entityType,
    entityId: input.entityId,
    organizationId: input.organizationId ?? null,
    body: input.body,
    authorUserId: input.authorUserId ?? null,
    mentionUserIds: extractMentionUserIds(input.body),
    createdAt: now,
    updatedAt: now,
    pinned: Boolean(input.pinned),
    metadata: { ...(input.metadata ?? {}) },
  };
  noteStore.set(note.id, note);
  return { ...note, metadata: { ...note.metadata }, mentionUserIds: [...note.mentionUserIds] };
}

export function listEntityNotes(
  entityType: string,
  entityId: string
): EntityNote[] {
  return [...noteStore.values()]
    .filter((n) => n.entityType === entityType && n.entityId === entityId)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .map((n) => ({
      ...n,
      metadata: { ...n.metadata },
      mentionUserIds: [...n.mentionUserIds],
    }));
}

export function pinEntityNote(noteId: string, pinned = true): EntityNote {
  const existing = noteStore.get(noteId);
  if (!existing) throw new Error(`Note not found: ${noteId}`);
  const updated = { ...existing, pinned, updatedAt: new Date().toISOString() };
  noteStore.set(noteId, updated);
  return {
    ...updated,
    metadata: { ...updated.metadata },
    mentionUserIds: [...updated.mentionUserIds],
  };
}
