/**
 * Full advisory prediction payload — Sprint 201.
 * Always includes evidence, assumptions, and confidence.
 */

import type {
  PredictionAssumption,
  PredictionDriver,
  PredictionEvidence,
  PreventiveAction,
} from "./PredictionEvidence";
import type { PredictionHorizon } from "./PredictionHorizon";
import type {
  PredictionKind,
  PredictionRiskLevel,
  PredictionStance,
  PredictionTrend,
} from "./PredictionTypes";

export type PredictionStateSnapshot = {
  readonly label: string;
  readonly stance: PredictionStance;
  readonly summary: string;
  readonly score?: number;
};

export type PredictionResult = {
  readonly id: string;
  readonly kind: PredictionKind;
  readonly title: string;
  readonly advisoryNotice: string;
  readonly horizon: PredictionHorizon;
  readonly horizonLabel: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly generatedAt: string;
  readonly currentState: PredictionStateSnapshot;
  readonly predictedState: PredictionStateSnapshot;
  readonly trend: PredictionTrend;
  readonly confidence: number;
  readonly confidenceBand: "low" | "moderate" | "high";
  readonly confidenceExplanation: string;
  readonly riskLevel: PredictionRiskLevel;
  readonly primaryDrivers: readonly PredictionDriver[];
  readonly supportingContributors: readonly string[];
  readonly evidence: readonly PredictionEvidence[];
  readonly assumptions: readonly PredictionAssumption[];
  readonly recommendedPreventiveActions: readonly PreventiveAction[];
  readonly narrative: string;
  readonly insufficientData: boolean;
};

export type DecisionConsequenceForecast = {
  readonly decisionId: string;
  readonly decisionTitle: string;
  readonly horizon: PredictionHorizon;
  readonly horizonLabel: string;
  readonly relatedPredictionKind: PredictionKind;
  readonly statement: string;
  readonly confidence: number;
  readonly riskLevel: PredictionRiskLevel;
  readonly primaryDrivers: readonly string[];
  readonly assumptions: readonly string[];
  readonly advisoryNotice: string;
};
