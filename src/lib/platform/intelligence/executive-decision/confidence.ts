/**
 * Executive Decision Intelligence — DecisionConfidence (Sprint 026).
 */

import type { DecisionConfidence as DecisionConfidenceContract } from "@/lib/platform/intelligence/executive-decision/contracts";
import {
  clamp01,
  levelFromValue,
} from "@/lib/platform/intelligence/executive-decision/scoring";
import type { DecisionConfidenceScore } from "@/lib/platform/intelligence/executive-decision/types";
import type { GraphAnalysisResult } from "@/lib/platform/intelligence/executive-graph/types";

/**
 * DecisionConfidence — calibrated confidence for decision outputs.
 */
export class DecisionConfidenceEngine implements DecisionConfidenceContract {
  score(
    factors: Array<{ key: string; label: string; contribution: number }>
  ): DecisionConfidenceScore {
    const raw = factors.reduce((sum, f) => sum + f.contribution, 0);
    const value = clamp01(raw);
    return {
      value,
      level: levelFromValue(value),
      factors,
    };
  }

  fromValue(value: number): DecisionConfidenceScore {
    const v = clamp01(value);
    return {
      value: v,
      level: levelFromValue(v),
      factors: [{ key: "base", label: "Base confidence", contribution: v }],
    };
  }

  fromGraphAnalysis(
    analysis: GraphAnalysisResult | null | undefined
  ): DecisionConfidenceScore {
    if (!analysis) {
      return this.fromValue(0.45);
    }

    const priorityConfidence =
      analysis.priorities.length === 0
        ? 0.4
        : analysis.priorities.reduce((s, p) => s + p.confidence, 0) /
          analysis.priorities.length;

    const findingConfidence =
      analysis.findings.length === 0
        ? 0.4
        : analysis.findings.reduce((s, f) => s + f.confidence.value, 0) /
          analysis.findings.length;

    const signalDensity = clamp01(
      (analysis.dashboard.metrics.nodeCount + analysis.dashboard.metrics.edgeCount) /
        60
    );

    return this.score([
      {
        key: "priority_confidence",
        label: "Priority confidence",
        contribution: priorityConfidence * 0.35,
      },
      {
        key: "finding_confidence",
        label: "Finding confidence",
        contribution: findingConfidence * 0.35,
      },
      {
        key: "signal_density",
        label: "Graph signal density",
        contribution: signalDensity * 0.2,
      },
      {
        key: "analysis_present",
        label: "Graph analysis available",
        contribution: 0.1,
      },
    ]);
  }
}

/** Alias matching Sprint 026 naming. */
export { DecisionConfidenceEngine as DecisionConfidence };
