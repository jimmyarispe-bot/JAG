/**
 * Recommendation engine — ordered actionable fixes from diagnosis + history.
 */

import { listCapturedKnowledge } from "../incident-history/store";
import type { RootCauseDiagnosis } from "../types";

export function buildRecommendations(
  diagnosis: RootCauseDiagnosis
): readonly string[] {
  const fromHistory = listCapturedKnowledge(20)
    .filter(
      (k) =>
        k.verified &&
        (k.intent === diagnosis.intent ||
          k.problem.toLowerCase().includes(diagnosis.intent.replace(/_/g, " ")))
    )
    .slice(0, 2)
    .map((k) => `Prior verified fix: ${k.resolution}`);

  const out = [
    diagnosis.recommendedFix,
    ...diagnosis.preventativeGuidance.map((g) => `Prevent: ${g}`),
    ...fromHistory,
  ];
  if (diagnosis.relatedWalkthroughId) {
    out.push(`Launch walkthrough ${diagnosis.relatedWalkthroughId}`);
  }
  if (diagnosis.relatedTutorialId) {
    out.push(`Open tutorial ${diagnosis.relatedTutorialId}`);
  }
  return Object.freeze([...new Set(out)]);
}
