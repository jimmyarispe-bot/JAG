/**
 * Portfolio categorization for innovation candidates.
 */

import type {
  InnovationPattern,
  OpportunityScores,
  PortfolioCategory,
} from "../types";

export function categorizePortfolio(input: {
  pattern: InnovationPattern;
  scores: OpportunityScores;
  effortHint: "S" | "M" | "L";
}): PortfolioCategory {
  const { pattern, scores, effortHint } = input;

  if (scores.total < 40) return "Deferred";
  if (
    pattern.kind === "emerging_opportunity" &&
    scores.technicalFeasibility < 50
  ) {
    return "Experimental";
  }
  if (
    pattern.kind === "emerging_opportunity" ||
    (scores.confidence < 55 && scores.businessValue > 70)
  ) {
    return "Research";
  }
  if (
    pattern.theme.includes("platform") ||
    pattern.theme.includes("evolution") ||
    pattern.kind === "frequently_requested"
  ) {
    if (effortHint === "L" && scores.strategicAlignment >= 70) {
      return "Strategic Investments";
    }
    return "Platform";
  }
  if (
    pattern.theme.includes("academy") ||
    pattern.theme.includes("attendance") ||
    pattern.theme.includes("enrollment") ||
    pattern.theme.includes("payroll")
  ) {
    return effortHint === "S" && scores.total >= 65
      ? "Quick Wins"
      : "Industry";
  }
  if (effortHint === "S" && scores.total >= 60 && scores.risk <= 45) {
    return "Quick Wins";
  }
  if (scores.strategicAlignment >= 75 && effortHint !== "S") {
    return "Strategic Investments";
  }
  return "Strategic Investments";
}

export function effortHintFromScores(
  scores: OpportunityScores
): "S" | "M" | "L" {
  if (scores.technicalFeasibility >= 70 && scores.risk <= 40) return "S";
  if (scores.technicalFeasibility >= 50) return "M";
  return "L";
}
