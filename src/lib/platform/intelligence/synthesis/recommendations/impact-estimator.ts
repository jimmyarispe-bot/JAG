import type { SynthesisScores } from "@/lib/platform/intelligence/synthesis/types";

export function estimateRecommendationImpact(scores: SynthesisScores): string {
  if (scores.priority === "critical") {
    return "High — stabilizing this cluster likely protects enrollment, cash, and instructional continuity within the immediate horizon.";
  }
  if (scores.priority === "high") {
    return "Material — targeted actions should measurably improve business and operational impact scores within the near term.";
  }
  if (scores.priority === "medium") {
    return "Moderate — improvements expected if actions address the correlated domains together rather than in isolation.";
  }
  return "Limited — monitor and schedule non-urgent improvements.";
}
