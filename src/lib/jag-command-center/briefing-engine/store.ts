/**
 * Persisted generated executive briefings (application memory).
 */

import { createHash } from "node:crypto";
import type {
  JagBriefingListItem,
  JagBriefingNote,
  JagBriefingScheduledReview,
  JagBriefingSectionId,
  JagExecutiveBriefing,
} from "./types";

const byId = new Map<string, JagExecutiveBriefing>();
const byShareToken = new Map<string, string>();

export function resetBriefingStoreForTests(): void {
  byId.clear();
  byShareToken.clear();
}

export function saveBriefing(briefing: JagExecutiveBriefing): void {
  byId.set(briefing.id, briefing);
  if (briefing.shareToken) {
    byShareToken.set(briefing.shareToken, briefing.id);
  }
}

export function getBriefing(id: string): JagExecutiveBriefing | null {
  return byId.get(id) ?? null;
}

export function getBriefingByShareToken(
  token: string
): JagExecutiveBriefing | null {
  const id = byShareToken.get(token);
  if (!id) return null;
  return byId.get(id) ?? null;
}

export function listBriefings(options?: {
  organizationId?: string;
  limit?: number;
}): readonly JagBriefingListItem[] {
  const limit = options?.limit ?? 50;
  let items = [...byId.values()];
  if (options?.organizationId) {
    items = items.filter(
      (b) =>
        b.organizationId === options.organizationId ||
        b.organizationIds.includes(options.organizationId!)
    );
  }
  items.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  return items.slice(0, limit).map(toListItem);
}

export function enableBriefingShare(
  briefingId: string
): string | null {
  const briefing = byId.get(briefingId);
  if (!briefing) return null;
  if (briefing.shareToken) return briefing.shareToken;

  const token = createHash("sha256")
    .update(`share|${briefingId}|${briefing.generatedAt}`)
    .digest("hex")
    .slice(0, 32);

  const updated: JagExecutiveBriefing = { ...briefing, shareToken: token };
  byId.set(briefingId, updated);
  byShareToken.set(token, briefingId);
  return token;
}

export function addBriefingNote(input: {
  briefingId: string;
  actor: string;
  text: string;
  sectionId?: JagBriefingSectionId;
  at?: string;
}): JagBriefingNote | null {
  const briefing = byId.get(input.briefingId);
  if (!briefing) return null;
  const at = input.at ?? new Date().toISOString();
  const note: JagBriefingNote = {
    id: `${input.briefingId}:note:${at}`,
    at,
    actor: input.actor,
    text: input.text.trim(),
    sectionId: input.sectionId,
  };
  const updated: JagExecutiveBriefing = {
    ...briefing,
    notes: [...briefing.notes, note],
  };
  byId.set(input.briefingId, updated);
  return note;
}

export function scheduleBriefingReview(input: {
  briefingId: string;
  actor: string;
  at: string;
  note: string;
}): JagBriefingScheduledReview | null {
  const briefing = byId.get(input.briefingId);
  if (!briefing) return null;
  const review: JagBriefingScheduledReview = {
    at: input.at,
    note: input.note.trim(),
    scheduledBy: input.actor,
    scheduledAt: new Date().toISOString(),
  };
  byId.set(input.briefingId, { ...briefing, scheduledReview: review });
  return review;
}

function toListItem(b: JagExecutiveBriefing): JagBriefingListItem {
  return {
    id: b.id,
    organizationId: b.organizationId,
    organizationName: b.organizationName,
    organizationIds: b.organizationIds,
    scope: b.scope,
    kind: b.kind,
    kindLabel: b.kindLabel,
    title: b.title,
    generatedAt: b.generatedAt,
    timeline: b.window.timeline,
    windowLabel: b.window.label,
    overallConfidence: b.overallConfidence,
    hasSubstance: b.hasSubstance,
  };
}
