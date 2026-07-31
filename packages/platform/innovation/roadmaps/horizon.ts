/**
 * Roadmap horizon assignment — Now / Next / Later / Future.
 */

import type {
  OpportunityScores,
  PortfolioCategory,
  RoadmapHorizon,
} from "../types";

export function assignRoadmapHorizon(input: {
  scores: OpportunityScores;
  category: PortfolioCategory;
  effort: "S" | "M" | "L";
}): RoadmapHorizon {
  if (input.category === "Deferred") return "Future";
  if (input.category === "Experimental" || input.category === "Research") {
    return input.scores.confidence >= 60 ? "Later" : "Future";
  }
  if (
    input.category === "Quick Wins" ||
    (input.effort === "S" && input.scores.total >= 70)
  ) {
    return "Now";
  }
  if (input.scores.total >= 65 || input.category === "Strategic Investments") {
    return input.effort === "L" ? "Later" : "Next";
  }
  if (input.scores.total >= 50) return "Later";
  return "Future";
}
