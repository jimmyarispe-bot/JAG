/**
 * Scenario result payload — Sprint 202.
 */

import type { ScenarioAssumption } from "./ScenarioAssumptions";
import type {
  ScenarioImpactDimension,
  ScenarioInputs,
  ScenarioKind,
  ScenarioStance,
} from "./ScenarioTypes";

export type ScenarioStateSnapshot = {
  readonly label: string;
  readonly stance: ScenarioStance;
  readonly summary: string;
  readonly score: number;
};

export type ScenarioDriver = {
  readonly id: string;
  readonly label: string;
  readonly direction: "positive" | "negative" | "neutral";
  readonly contribution: number;
  readonly explanation: string;
};

export type ScenarioEvidence = {
  readonly id: string;
  readonly source: string;
  readonly contributorId?: string;
  readonly summary: string;
  readonly kind: "observed" | "derived" | "input";
};

export type ScenarioTradeOff = {
  readonly id: string;
  readonly gain: string;
  readonly cost: string;
};

export type ScenarioRecommendedDecision = {
  readonly id: string;
  readonly title: string;
  readonly rationale: string;
  readonly urgency: "now" | "soon" | "monitor";
};

export type ScenarioDimensionImpact = {
  readonly dimension: ScenarioImpactDimension;
  readonly label: string;
  readonly currentScore: number;
  readonly scenarioScore: number;
  readonly delta: number;
  readonly summary: string;
};

export type ScenarioResult = {
  readonly id: string;
  readonly kind: ScenarioKind;
  readonly title: string;
  readonly advisoryNotice: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly generatedAt: string;
  readonly inputs: ScenarioInputs;
  readonly currentState: ScenarioStateSnapshot;
  readonly scenarioState: ScenarioStateSnapshot;
  readonly projectedDifference: {
    readonly scoreDelta: number;
    readonly summary: string;
    readonly dimensions: readonly ScenarioDimensionImpact[];
  };
  readonly confidence: number;
  readonly confidenceBand: "low" | "moderate" | "high";
  readonly confidenceExplanation: string;
  readonly primaryDrivers: readonly ScenarioDriver[];
  readonly evidence: readonly ScenarioEvidence[];
  readonly assumptions: readonly ScenarioAssumption[];
  readonly risks: readonly string[];
  readonly opportunities: readonly string[];
  readonly tradeOffs: readonly ScenarioTradeOff[];
  readonly recommendedDecisions: readonly ScenarioRecommendedDecision[];
  readonly narrative: string;
  readonly insufficientBaseline: boolean;
};

export type DecisionWhatIfBranch = "approve" | "defer" | "reject";

export type DecisionWhatIfResult = {
  readonly decisionId: string;
  readonly decisionTitle: string;
  readonly branch: DecisionWhatIfBranch;
  readonly statement: string;
  readonly scenario: ScenarioResult;
  readonly advisoryNotice: string;
};
