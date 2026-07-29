/**
 * Confidence model for advisory forecasts — Sprint 201.
 */

import { horizonToDays, type PredictionHorizon } from "./PredictionHorizon";

export type ConfidenceInputs = {
  readonly signalQuality: number;
  readonly evidenceCount: number;
  readonly contributorCount: number;
  readonly averageContributorConfidence: number;
  readonly horizon: PredictionHorizon;
  readonly insufficientData: boolean;
  readonly pressureScore: number;
};

export type ConfidenceOutput = {
  readonly confidence: number;
  readonly band: "low" | "moderate" | "high";
  readonly explanation: string;
  readonly factors: Readonly<Record<string, number>>;
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function bandOf(c: number): "low" | "moderate" | "high" {
  if (c >= 0.7) return "high";
  if (c >= 0.45) return "moderate";
  return "low";
}

/**
 * Longer horizons reduce confidence; thin evidence reduces confidence;
 * contributor agreement (avg confidence) raises it.
 */
export function computeConfidence(input: ConfidenceInputs): ConfidenceOutput {
  if (input.insufficientData) {
    return {
      confidence: 0,
      band: "low",
      explanation:
        "Confidence is zero because required contributor signals are missing. Bind Education outputs before relying on this forecast.",
      factors: {
        signalQuality: 0,
        evidence: 0,
        horizonPenalty: 1,
        contributorConfidence: 0,
      },
    };
  }

  const days = horizonToDays(input.horizon);
  const horizonPenalty = clamp01(days / 400);
  const evidenceFactor = clamp01(input.evidenceCount / 4);
  const contributorFactor = clamp01(input.contributorCount / 2);
  const avgConf = clamp01(input.averageContributorConfidence);
  const quality = clamp01(input.signalQuality);

  // Pressure slightly lowers confidence (more moving parts)
  const pressurePenalty = clamp01(input.pressureScore * 0.15);

  const raw =
    quality * 0.35 +
    evidenceFactor * 0.2 +
    contributorFactor * 0.15 +
    avgConf * 0.25 +
    (1 - horizonPenalty) * 0.15 -
    pressurePenalty;

  const confidence = Number(clamp01(raw).toFixed(3));
  const band = bandOf(confidence);

  const explanation = [
    `Confidence ${band} (${(confidence * 100).toFixed(0)}%) from signal quality (${(quality * 100).toFixed(0)}%),`,
    `${input.evidenceCount} evidence item(s), ${input.contributorCount} contributor(s),`,
    `and horizon length (${days} days; longer horizons reduce certainty).`,
    "Forecasts are advisory — confidence reflects evidence strength, not certainty of outcome.",
  ].join(" ");

  return {
    confidence,
    band,
    explanation,
    factors: {
      signalQuality: quality,
      evidence: evidenceFactor,
      contributors: contributorFactor,
      contributorConfidence: avgConf,
      horizonPenalty,
      pressurePenalty,
    },
  };
}
