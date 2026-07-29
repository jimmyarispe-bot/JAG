/**
 * Persisted generated executive briefings (application memory).
 */

import type { JagExecutiveBriefing, JagBriefingListItem } from "./types";

const byId = new Map<string, JagExecutiveBriefing>();

export function resetBriefingStoreForTests(): void {
  byId.clear();
}

export function saveBriefing(briefing: JagExecutiveBriefing): void {
  byId.set(briefing.id, briefing);
}

export function getBriefing(id: string): JagExecutiveBriefing | null {
  return byId.get(id) ?? null;
}

export function listBriefings(options?: {
  organizationId?: string;
  limit?: number;
}): readonly JagBriefingListItem[] {
  const limit = options?.limit ?? 50;
  let items = [...byId.values()];
  if (options?.organizationId) {
    items = items.filter((b) => b.organizationId === options.organizationId);
  }
  items.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  return items.slice(0, limit).map(toListItem);
}

function toListItem(b: JagExecutiveBriefing): JagBriefingListItem {
  return {
    id: b.id,
    organizationId: b.organizationId,
    organizationName: b.organizationName,
    title: b.title,
    generatedAt: b.generatedAt,
    timeline: b.window.timeline,
    windowLabel: b.window.label,
    overallConfidence: b.overallConfidence,
    hasSubstance: b.hasSubstance,
  };
}
