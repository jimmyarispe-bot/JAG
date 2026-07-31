/**
 * Recommendation priority scoring.
 */

export function scoreRecommendation(input: {
  urgency: number;
  businessImpact: number;
  risk: number;
  personaFit: number;
  recentActivity: number;
  trainingCompletion: number;
  confidence: number;
}): number {
  const trainingGap = Math.max(0, 100 - input.trainingCompletion);
  const raw =
    input.urgency * 0.22 +
    input.businessImpact * 0.2 +
    input.risk * 0.2 +
    input.personaFit * 0.12 +
    input.recentActivity * 0.1 +
    trainingGap * 0.08 +
    input.confidence * 0.08;
  return Math.round(Math.min(100, Math.max(0, raw)));
}
