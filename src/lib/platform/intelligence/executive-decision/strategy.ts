/**
 * Executive Decision Intelligence — StrategyEngine (Sprint 026).
 */

import type {
  DecisionConfidence as DecisionConfidenceContract,
  DecisionScoring as DecisionScoringContract,
  StrategyEngine as StrategyEngineContract,
} from "@/lib/platform/intelligence/executive-decision/contracts";
import { DecisionConfidenceEngine } from "@/lib/platform/intelligence/executive-decision/confidence";
import { DecisionScoringEngine } from "@/lib/platform/intelligence/executive-decision/scoring";
import type {
  DecisionBaseline,
  StrategyAnalysisResult,
  StrategyInitiative,
  StrategyRanking,
} from "@/lib/platform/intelligence/executive-decision/types";
import type { GraphAnalysisResult } from "@/lib/platform/intelligence/executive-graph/types";

export interface StrategyEngineDependencies {
  scoring?: DecisionScoringContract;
  confidence?: DecisionConfidenceContract;
}

/**
 * StrategyEngine — ranks strategic initiatives by risk-adjusted ROI + mission.
 */
export class StrategyEngineImpl implements StrategyEngineContract {
  private readonly scoring: DecisionScoringContract;
  private readonly confidence: DecisionConfidenceContract;

  constructor(dependencies: StrategyEngineDependencies = {}) {
    this.scoring = dependencies.scoring ?? new DecisionScoringEngine();
    this.confidence = dependencies.confidence ?? new DecisionConfidenceEngine();
  }

  rank(input: {
    scenarioId: string;
    initiatives: StrategyInitiative[];
    baseline: DecisionBaseline;
    analysis: GraphAnalysisResult | null;
  }): StrategyAnalysisResult {
    const { scenarioId, initiatives, baseline, analysis } = input;

    if (initiatives.length === 0) {
      return {
        scenarioId,
        rankings: [],
        recommendedInitiativeId: null,
        summary: "No strategic initiatives supplied for ranking.",
        confidence: this.confidence.fromValue(0.4),
      };
    }

    const orgRisk = analysis?.dashboard.overallRisk ?? baseline.overallRisk;
    const opportunityBoost =
      analysis?.dashboard.overallOpportunity ?? baseline.overallOpportunity;

    const rankings: StrategyRanking[] = initiatives
      .map((initiative) => {
        const roiScore = this.scoring.scoreRoi(
          initiative.investment,
          initiative.expectedReturn,
          initiative.timeHorizonMonths
        );
        const riskAdjustedRoi = roiScore * (1 - initiative.riskWeight * 0.5) * (1 - orgRisk * 0.25);
        const missionScore = initiative.missionWeight * (0.7 + opportunityBoost * 0.3);
        const compositeScore = this.scoring.scoreComposite({
          roi: riskAdjustedRoi,
          mission: missionScore,
          risk: initiative.riskWeight,
          confidence: analysis ? 0.75 : 0.55,
        });

        return {
          initiativeId: initiative.id,
          title: initiative.title,
          kind: initiative.kind,
          roiScore,
          riskAdjustedRoi,
          missionScore,
          compositeScore,
          rank: 0,
          rationale: `${initiative.title}: ROI ${roiScore.toFixed(2)}, risk-adjusted ${riskAdjustedRoi.toFixed(2)}, mission ${missionScore.toFixed(2)}.`,
        };
      })
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    const top = rankings[0]!;
    const confidence = this.confidence.score([
      {
        key: "initiative_count",
        label: "Initiative coverage",
        contribution: Math.min(0.35, initiatives.length * 0.12),
      },
      {
        key: "graph_context",
        label: "Graph context",
        contribution: analysis ? 0.35 : 0.15,
      },
      {
        key: "top_separation",
        label: "Top-rank separation",
        contribution:
          rankings.length > 1
            ? Math.min(0.3, Math.abs(top.compositeScore - rankings[1]!.compositeScore) * 2)
            : 0.2,
      },
    ]);

    return {
      scenarioId,
      rankings,
      recommendedInitiativeId: top.initiativeId,
      summary: `Highest composite ROI initiative: "${top.title}" (score ${top.compositeScore.toFixed(3)}).`,
      confidence,
    };
  }
}

/** Alias matching Sprint 026 naming. */
export { StrategyEngineImpl as StrategyEngine };
