/**
 * Prioritization — multi-factor scoring for Evolution proposals.
 */

import type {
  EvolutionClassification,
  EvolutionUnderstanding,
  PriorityScores,
  RepositoryAnalysis,
} from "../types";

function clamp(n: number): number {
  return Math.round(Math.min(100, Math.max(0, n)));
}

export function scorePriority(input: {
  understanding: EvolutionUnderstanding;
  repository: RepositoryAnalysis;
  classification: EvolutionClassification;
}): PriorityScores {
  const pMap = {
    low: 25,
    medium: 50,
    high: 75,
    critical: 95,
  } as const;
  const businessValue = pMap[input.understanding.priorityHint];
  const userImpact =
    input.understanding.priorityHint === "critical"
      ? 90
      : input.understanding.priorityHint === "high"
        ? 75
        : 55;
  const frequency = input.repository.duplicateRequest
    ? 85
    : input.repository.hits.filter((h) => h.kind === "help_incident").length *
        15 || 40;
  const risk =
    input.classification === "Bug Fix"
      ? 80
      : input.classification === "Platform Enhancement (PER)"
        ? 65
        : 35;
  const strategicAlignment =
    input.classification === "Platform Enhancement (PER)" ||
    input.classification === "Innovation Proposal"
      ? 80
      : input.classification === "Documentation Improvement" ||
          input.classification === "Training Improvement"
        ? 45
        : 60;
  const engineeringEffort = input.repository.alreadyExists
    ? 20
    : input.repository.partialImplementation
      ? 40
      : input.classification === "Platform Enhancement (PER)"
        ? 75
        : input.classification === "Organization Configuration" ||
            input.classification === "Personal Automation"
          ? 30
          : 55;
  const architectureImpact =
    input.classification === "Platform Enhancement (PER)"
      ? 80
      : input.classification === "Bug Fix"
        ? 40
        : input.classification === "Documentation Improvement" ||
            input.classification === "Training Improvement"
          ? 15
          : 50;
  const confidence = input.understanding.confidence;

  const total = clamp(
    businessValue * 0.18 +
      userImpact * 0.16 +
      Math.min(100, frequency) * 0.12 +
      risk * 0.1 +
      strategicAlignment * 0.14 +
      (100 - engineeringEffort) * 0.12 +
      (100 - architectureImpact) * 0.08 +
      confidence * 0.1
  );

  return {
    businessValue: clamp(businessValue),
    userImpact: clamp(userImpact),
    frequency: clamp(Math.min(100, frequency)),
    risk: clamp(risk),
    strategicAlignment: clamp(strategicAlignment),
    engineeringEffort: clamp(engineeringEffort),
    architectureImpact: clamp(architectureImpact),
    confidence: clamp(confidence),
    total,
  };
}
