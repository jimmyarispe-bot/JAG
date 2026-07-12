/**
 * Market to knowledge contribution intelligence.
 */

import type { MarketKnowledgeContributionEngine as MarketKnowledgeContributionEngineContract } from "@/lib/platform/intelligence/market/contracts";
import { clamp } from "@/lib/platform/intelligence/market/models";
import type {
  CompetitiveSuite,
  IndustrySuite,
  MarketBaseline,
  MarketKnowledgeContribution,
  MarketKnowledgeDraft,
  WhiteSpaceSuite,
} from "@/lib/platform/intelligence/market/types";

export class MarketKnowledgeContributionEngine implements MarketKnowledgeContributionEngineContract {
  contribute(input: {
    baseline: MarketBaseline;
    industry: IndustrySuite;
    competitive: CompetitiveSuite;
    whiteSpace: WhiteSpaceSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): MarketKnowledgeContribution {
    const { baseline, industry, competitive, whiteSpace, createId } = input;
    void input.now;
    const groups: Array<{ group: string; artifactType: string; sourceRef: string; seed: number }> = [
      {
        group: "industry segments",
        artifactType: "industry_knowledge",
        sourceRef: industry.segments[0]?.id ?? "industry",
        seed: industry.attractivenessScore,
      },
      {
        group: "competitive landscape",
        artifactType: "competitive_knowledge",
        sourceRef: competitive.competitors[0]?.id ?? "competitive",
        seed: competitive.positionScore,
      },
      {
        group: "white space opportunities",
        artifactType: "white_space_knowledge",
        sourceRef: whiteSpace.opportunities[0]?.id ?? "white_space",
        seed: whiteSpace.whiteSpaceScore,
      },
      {
        group: "market signals",
        artifactType: "market_signal_knowledge",
        sourceRef: "signals",
        seed: baseline.signalDensity * 100,
      },
    ];
    const artifacts: MarketKnowledgeDraft[] = groups.map((group) => {
      const confidence = clamp(baseline.knowledgeContributionScore * 0.55 + group.seed * 0.45);
      return {
        id: createId("mkt-knowledge"),
        type: group.artifactType,
        title: `${group.group} knowledge`,
        confidence,
        sourceRef: group.sourceRef,
        validated: confidence >= 60,
        metadata: { group: group.group, industryAttractiveness: industry.attractivenessScore },
      };
    });
    const validatedCount = artifacts.filter((artifact) => artifact.validated).length;
    const contributionScore = clamp(
      baseline.knowledgeContributionScore * 0.7 + (validatedCount / Math.max(1, artifacts.length)) * 30
    );

    return {
      artifacts,
      contributionScore,
      validatedCount,
      narrative: `Market knowledge contribution ${Math.round(contributionScore)} with ${validatedCount} validated drafts.`,
    };
  }
}
