/**
 * Predictive Intelligence — shared types / DTOs (Sprint 065).
 *
 * Leaf module: soft-reads decision-intelligence / executive-memory / briefing lights.
 * Package path is `executive-predictive` (not `predictive-intelligence/`) to avoid
 * regenerating Sprint 028 Predictive Intelligence (module id `predictive`).
 */

import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const EXECUTIVE_PREDICTIVE_VERSION = "0.1.0";
export const EXECUTIVE_PREDICTIVE_MODULE_ID = "executive-predictive" as const;

export const FORECAST_SUBJECTS = [
  "enrollment",
  "revenue",
  "cash",
  "staffing",
  "retention",
  "parent_satisfaction",
  "operations",
  "compliance",
] as const;

export const FORECAST_HORIZONS = [
  "30d",
  "90d",
  "180d",
  "365d",
] as const;

export const SCENARIO_KINDS = ["best", "expected", "worst", "custom"] as const;

export type ForecastSubject = (typeof FORECAST_SUBJECTS)[number];
export type ForecastHorizon = (typeof FORECAST_HORIZONS)[number];
export type ScenarioKind = (typeof SCENARIO_KINDS)[number];
export type PredictiveMetadata = Record<string, unknown>;

export interface PredictiveScope {
  organizationId: string | null;
  schoolId: string | null;
}

/** Soft-read of DecisionIntelligenceResult. */
export interface DecisionIntelligenceResultLight extends ResultLightBase {
  requestId?: string;
  recommendation?: {
    id?: string;
    executiveSummary?: string;
    recommendedOptionId?: string | null;
    rankedOptions?: Array<{
      id?: string;
      title?: string;
      summary?: string;
      category?: string;
      confidence?: number;
      estimatedEffort?: string;
      scorecard?: {
        overall?: number;
        expectedImpact?: number;
        financialImpact?: number;
        operationalImpact?: number;
        risk?: number;
        effort?: number;
      };
      scenarios?: Array<{
        label?: string;
        narrative?: string;
        probability?: number;
        impactScore?: number;
      }>;
    }>;
    confidence?: number;
    issue?: { title?: string; kind?: string; domains?: string[] };
  };
  contributingDomains?: string[];
}

/** Soft-read of ExecutiveMemoryResult. */
export interface ExecutiveMemoryResultLight extends ResultLightBase {
  timeline?: Array<{
    at?: string;
    kind?: string;
    title?: string;
    summary?: string;
    domains?: string[];
  }>;
  decisions?: Array<{
    id?: string;
    title?: string;
    expectedOutcome?: string;
    actualOutcome?: string;
    domains?: string[];
    confidence?: number;
  }>;
  lessons?: Array<{
    id?: string;
    title?: string;
    summary?: string;
    change?: string[];
    domains?: string[];
  }>;
  contributingDomains?: string[];
}

/** Soft-read of BriefingResult for current signals. */
export interface BriefingResultLight extends ResultLightBase {
  healthScore?: { value?: number; label?: string };
  overnight?: {
    summary?: string;
    newRisks?: string[];
    staffingChanges?: string[];
    financialMovement?: string[];
  };
  briefing?: {
    sections?: {
      executiveSummary?: string;
      topRisks?: Array<{
        title?: string;
        summary?: string;
        severity?: number;
        urgency?: number;
        domains?: string[];
      }>;
      topOpportunities?: Array<{
        title?: string;
        summary?: string;
        estimatedImpact?: number;
        domains?: string[];
      }>;
    };
  };
  contributingDomains?: string[];
}

export interface HistoricalSignal {
  id: string;
  subject: ForecastSubject | string;
  at: string;
  value: number;
  direction: "up" | "down" | "flat" | "unknown";
  domain?: string;
  narrative?: string;
}

export interface ForecastAssumption {
  id: string;
  statement: string;
  critical: boolean;
}

export interface PredictionEvidence {
  id: string;
  statement: string;
  source: "history" | "current_signal" | "decision" | "assumption" | "memory";
  supporting: boolean;
  weight?: number;
  domain?: string;
}

export interface PredictionExplainability {
  why: string;
  historicalEvidence: PredictionEvidence[];
  currentSignals: PredictionEvidence[];
  invalidatingAssumptions: string[];
  confidenceGuidance: string;
  confidence: number;
}

export interface ForecastPoint {
  horizon: ForecastHorizon;
  value: number;
  delta: number;
  unit: string;
}

export interface OrganizationalForecast {
  id: string;
  subject: ForecastSubject;
  horizon: ForecastHorizon;
  baselineValue: number;
  projectedValue: number;
  delta: number;
  unit: string;
  direction: "improving" | "degrading" | "stable" | "mixed";
  confidence: number;
  assumptions: ForecastAssumption[];
  evidence: PredictionEvidence[];
  explainability: PredictionExplainability;
  points: ForecastPoint[];
  generatedAt: string;
}

export interface ScenarioProjection {
  id: string;
  kind: ScenarioKind;
  label: string;
  narrative: string;
  probability: number;
  forecasts: Array<{
    subject: ForecastSubject;
    projectedValue: number;
    delta: number;
  }>;
  overallOutlook: number;
  confidence: number;
}

export interface EmergingSignal {
  id: string;
  title: string;
  subject: ForecastSubject | string;
  narrative: string;
  strength: number;
  trend: "rising" | "falling" | "volatile";
  domains: string[];
  confidence: number;
  firstDetectedAt: string;
  evidence: PredictionEvidence[];
}

export interface DecisionImpactForecast {
  id: string;
  optionId: string;
  optionTitle: string;
  organizationalImpact: number;
  financialImpact: number;
  operationalImpact: number;
  implementationHorizon: ForecastHorizon;
  confidence: number;
  narrative: string;
  scenarios: ScenarioProjection[];
  explainability: PredictionExplainability;
}

export interface DriftObservation {
  id: string;
  subject: ForecastSubject | string;
  forecastValue: number;
  actualValue: number;
  error: number;
  absoluteError: number;
  at: string;
  confidenceWas: number;
}

export interface DriftReport {
  observations: DriftObservation[];
  meanAbsoluteError: number;
  bias: number;
  calibrationNote: string;
  degrading: boolean;
}

export interface PredictionRecord {
  id: string;
  subject: ForecastSubject | string;
  horizon: ForecastHorizon;
  confidence: number;
  assumptions: ForecastAssumption[];
  supportingEvidence: PredictionEvidence[];
  alternativeScenarios: ScenarioKind[];
  timestamp: string;
  forecastId?: string;
}

export interface ExecutivePredictiveRequest {
  requestId: string;
  scope: PredictiveScope;
  decisionResult?: DecisionIntelligenceResultLight;
  memoryResult?: ExecutiveMemoryResultLight;
  briefingResult?: BriefingResultLight;
  historicalSignals?: HistoricalSignal[];
  /** Optional actuals for drift detection. */
  actuals?: Array<{ subject: ForecastSubject | string; value: number; at?: string }>;
  customScenario?: { label: string; magnitude?: number; narrative?: string };
  periodLabel?: string;
  metadata?: PredictiveMetadata;
}

export interface ExecutivePredictiveResult {
  requestId: string;
  version: string;
  scope: PredictiveScope;
  generatedAt: string;
  healthScore: { value: number; label: string };
  forecasts: OrganizationalForecast[];
  scenarios: ScenarioProjection[];
  emergingSignals: EmergingSignal[];
  decisionImpacts: DecisionImpactForecast[];
  drift: DriftReport;
  registry: PredictionRecord[];
  explainability: PredictionExplainability;
  contributingDomains: string[];
  metadata: PredictiveMetadata;
}
