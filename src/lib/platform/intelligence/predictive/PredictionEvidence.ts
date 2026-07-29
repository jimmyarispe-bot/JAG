/**
 * Evidence and assumptions for advisory forecasts — Sprint 201.
 */

export type PredictionEvidence = {
  readonly id: string;
  readonly source: string;
  readonly contributorId?: string;
  readonly summary: string;
  readonly weight: "primary" | "supporting" | "contextual";
  readonly observedAt?: string;
};

export type PredictionAssumption = {
  readonly id: string;
  readonly statement: string;
  readonly impactIfWrong: string;
};

export type PredictionDriver = {
  readonly id: string;
  readonly label: string;
  readonly direction: "positive" | "negative" | "neutral";
  readonly contribution: number;
  readonly explanation: string;
};

export type PreventiveAction = {
  readonly id: string;
  readonly title: string;
  readonly rationale: string;
  readonly urgency: "now" | "soon" | "monitor";
  readonly relatedDecisionKinds?: readonly string[];
};
