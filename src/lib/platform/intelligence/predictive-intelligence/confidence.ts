/**
 * Predictive Intelligence — PredictionConfidence (Sprint 028).
 */

import type { PredictionConfidence as PredictionConfidenceContract } from "@/lib/platform/intelligence/predictive-intelligence/contracts";
import {
  clamp01,
  levelFromValue,
} from "@/lib/platform/intelligence/predictive-intelligence/scoring";
import type {
  HistoricalSignal,
  PredictionConfidenceScore,
} from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { GraphAnalysisResult } from "@/lib/platform/intelligence/executive-graph/types";

/**
 * PredictionConfidence — calibrated confidence for forecast outputs.
 */
export class PredictionConfidenceEngine implements PredictionConfidenceContract {
  score(
    factors: Array<{ key: string; label: string; contribution: number }>
  ): PredictionConfidenceScore {
    const raw = factors.reduce((sum, f) => sum + f.contribution, 0);
    const value = clamp01(raw);
    return {
      value,
      level: levelFromValue(value),
      factors,
    };
  }

  fromValue(value: number): PredictionConfidenceScore {
    const v = clamp01(value);
    return {
      value: v,
      level: levelFromValue(v),
      factors: [{ key: "base", label: "Base confidence", contribution: v }],
    };
  }

  fromGraphAnalysis(
    analysis: GraphAnalysisResult | null | undefined
  ): PredictionConfidenceScore {
    if (!analysis) {
      return this.fromValue(0.42);
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
      (analysis.dashboard.metrics.nodeCount +
        analysis.dashboard.metrics.edgeCount) /
        60
    );

    return this.score([
      {
        key: "priority_confidence",
        label: "Graph priority confidence",
        contribution: priorityConfidence * 0.35,
      },
      {
        key: "finding_confidence",
        label: "Graph finding confidence",
        contribution: findingConfidence * 0.3,
      },
      {
        key: "signal_density",
        label: "Graph signal density",
        contribution: signalDensity * 0.25,
      },
      {
        key: "analysis_present",
        label: "Graph analysis available",
        contribution: 0.1,
      },
    ]);
  }

  fromSignals(signals: HistoricalSignal[]): PredictionConfidenceScore {
    if (signals.length === 0) {
      return this.fromValue(0.35);
    }

    const realSources = signals.filter((s) => s.source !== "synthetic").length;
    const coverage = clamp01(signals.length / 40);
    const authenticity = clamp01(realSources / Math.max(signals.length, 1));

    return this.score([
      {
        key: "coverage",
        label: "Historical coverage",
        contribution: coverage * 0.45,
      },
      {
        key: "authenticity",
        label: "Non-synthetic share",
        contribution: authenticity * 0.4,
      },
      {
        key: "presence",
        label: "Signals present",
        contribution: 0.15,
      },
    ]);
  }
}

/** Alias matching Sprint 028 naming. */
export { PredictionConfidenceEngine as PredictionConfidence };
