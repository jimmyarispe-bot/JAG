/**
 * Briefing resource helpers (safe for import outside "use server" modules).
 */

import type { JagExecutiveBriefing } from "./types";

/** Whether the briefing record references this decision id. */
export function briefingReferencesDecision(
  briefing: JagExecutiveBriefing,
  decisionId: string
): boolean {
  if (!decisionId.trim()) return false;
  for (const section of briefing.sections) {
    if (section.decisionIds.includes(decisionId)) return true;
    if (section.recommendations.some((r) => r.decisionId === decisionId)) {
      return true;
    }
  }
  if (briefing.recommendations.some((r) => r.decisionId === decisionId)) {
    return true;
  }
  if (briefing.insights.some((i) => i.decisionId === decisionId)) {
    return true;
  }
  return false;
}
