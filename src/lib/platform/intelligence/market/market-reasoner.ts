/**
 * Market reasoning intelligence.
 */

import type { MarketReasoner as MarketReasonerContract } from "@/lib/platform/intelligence/market/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/market/models";
import type {
  CompetitiveSuite,
  GeographicExpansionSuite,
  MarketBaseline,
  MarketReasoningResult,
  MarketSignalsSuite,
  WhiteSpaceSuite,
} from "@/lib/platform/intelligence/market/types";

export class MarketReasoner implements MarketReasonerContract {
  reason(input: {
    baseline: MarketBaseline;
    competitive: CompetitiveSuite;
    whiteSpace: WhiteSpaceSuite;
    geographicExpansion: GeographicExpansionSuite;
    signals: MarketSignalsSuite;
    question?: string;
    now: Date;
  }): MarketReasoningResult {
    void input.now;
    const connectedOpportunities = input.whiteSpace.opportunities
      .slice(0, 8)
      .map((opportunity) => opportunity.unmetNeed);
    const competitors = input.competitive.competitors.slice(0, 6).map((competitor) => competitor.name);
    const missingTopics = [
      ...(input.competitive.positionScore < 60 ? ["competitive positioning"] : []),
      ...(input.geographicExpansion.readinessScore < 60 ? ["geographic expansion readiness"] : []),
      ...(input.whiteSpace.whiteSpaceScore < 60 ? ["white space capture"] : []),
      ...(input.baseline.partnershipDensity < 55 ? ["partnership density"] : []),
    ];
    const confidence = buildConfidence([
      { key: "competitive", label: "Competitive position", contribution: input.competitive.positionScore / 100 },
      { key: "white_space", label: "White space clarity", contribution: input.whiteSpace.whiteSpaceScore / 100 },
      { key: "signals", label: "Signal density", contribution: input.signals.densityScore / 100 },
    ]);
    const answer =
      input.question ??
      `Market intelligence identified ${connectedOpportunities.length} white-space opportunities with hottest signal ${input.signals.hottestKind} and top expansion candidate ${input.geographicExpansion.topCandidate ?? "none"}.`;

    return {
      answer,
      connectedOpportunities,
      competitors,
      missingTopics,
      confidence,
      narrative: `Reasoning confidence ${confidence.level}; ${connectedOpportunities.length} opportunities and ${competitors.length} competitors considered.`,
    };
  }
}
