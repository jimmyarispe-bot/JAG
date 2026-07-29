/**
 * Registry of supported prediction kinds and default horizons — Sprint 201.
 */

import {
  STANDARD_PREDICTION_HORIZONS,
  type PredictionHorizon,
  type StandardPredictionHorizon,
} from "./PredictionHorizon";
import {
  PREDICTION_KIND_LABELS,
  PREDICTION_KINDS,
  type PredictionKind,
} from "./PredictionTypes";

export type PredictionDefinition = {
  readonly kind: PredictionKind;
  readonly title: string;
  readonly description: string;
  readonly defaultHorizon: StandardPredictionHorizon;
  readonly relatedContributorHints: readonly string[];
};

const DEFINITIONS: Record<PredictionKind, Omit<PredictionDefinition, "kind" | "title">> = {
  organization_health: {
    description: "Advisory projection of overall organizational health stance.",
    defaultHorizon: "30_days",
    relatedContributorHints: [
      "education.cognition.school_health",
      "education.cognition.operational_readiness",
    ],
  },
  student_success: {
    description: "Advisory projection of student success trajectory.",
    defaultHorizon: "90_days",
    relatedContributorHints: ["education.cognition.student_success"],
  },
  operational_readiness: {
    description: "Advisory projection of operational readiness under open decision pressure.",
    defaultHorizon: "30_days",
    relatedContributorHints: ["education.cognition.operational_readiness"],
  },
  funding_readiness: {
    description: "Advisory projection of funding readiness posture.",
    defaultHorizon: "90_days",
    relatedContributorHints: ["education.cognition.funding_readiness"],
  },
  decision_queue_growth: {
    description: "Advisory projection of executive decision queue volume.",
    defaultHorizon: "30_days",
    relatedContributorHints: ["jag.decision_center"],
  },
  staffing_capacity: {
    description: "Advisory projection of staffing capacity strain.",
    defaultHorizon: "90_days",
    relatedContributorHints: [
      "education.cognition.staffing",
      "education.cognition.capacity",
    ],
  },
  enrollment_trend: {
    description: "Advisory projection of enrollment direction.",
    defaultHorizon: "6_months",
    relatedContributorHints: ["education.cognition.enrollment"],
  },
  compliance_risk: {
    description: "Advisory projection of compliance risk level.",
    defaultHorizon: "90_days",
    relatedContributorHints: ["education.cognition.compliance"],
  },
};

export const PredictionRegistry = {
  listKinds(): readonly PredictionKind[] {
    return PREDICTION_KINDS;
  },

  listHorizons(): readonly StandardPredictionHorizon[] {
    return STANDARD_PREDICTION_HORIZONS;
  },

  get(kind: PredictionKind): PredictionDefinition {
    const def = DEFINITIONS[kind];
    return {
      kind,
      title: PREDICTION_KIND_LABELS[kind],
      ...def,
    };
  },

  list(): readonly PredictionDefinition[] {
    return PREDICTION_KINDS.map((kind) => this.get(kind));
  },

  defaultHorizonFor(kind: PredictionKind): PredictionHorizon {
    return DEFINITIONS[kind].defaultHorizon;
  },
} as const;
