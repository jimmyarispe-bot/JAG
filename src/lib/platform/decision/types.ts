/** Platform Decision Engine — B-05 Phase 1 foundation types */

export const DECISION_DEFINITION_STATUSES = ["draft", "active", "archived"] as const;
export type DecisionDefinitionStatus = (typeof DECISION_DEFINITION_STATUSES)[number];

/** How a registered decision type resolves recommendations. */
export const DECISION_ENGINE_MODES = ["rule", "ai_assisted", "hybrid"] as const;
export type DecisionEngineMode = (typeof DECISION_ENGINE_MODES)[number];

export const DECISION_CONDITION_OPERATORS = [
  "equals",
  "not_equals",
  "greater_than",
  "less_than",
  "contains",
  "in",
  "not_in",
  "exists",
  "not_exists",
] as const;
export type DecisionConditionOperator = (typeof DECISION_CONDITION_OPERATORS)[number];

export const RECOMMENDATION_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type RecommendationPriority = (typeof RECOMMENDATION_PRIORITIES)[number];

export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export interface DecisionConditionDefinition {
  key: string;
  field: string;
  operator: DecisionConditionOperator;
  value?: unknown;
  logicGroup?: string;
  negate?: boolean;
}

export interface DecisionRuleDefinition {
  key: string;
  label: string;
  description?: string;
  conditions?: DecisionConditionDefinition[];
  weight?: number;
  outcomeKey: string;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface EvidenceRequirementDefinition {
  key: string;
  label: string;
  required?: boolean;
  collectorKey?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface RecommendationOptionDefinition {
  outcomeKey: string;
  actionKey: string;
  label: string;
  description?: string;
  defaultPriority?: RecommendationPriority;
  metadata?: Record<string, unknown>;
}

export interface ScoringProfileDefinition {
  /** Per-outcome base weights — combined with rule weights during scoring. */
  outcomeWeights?: Record<string, number>;
  /** Minimum score required for a viable recommendation. */
  minimumScore?: number;
  metadata?: Record<string, unknown>;
}

/** Data-driven decision definition — domain modules register these at import time. */
export interface DecisionDefinition {
  decisionType: string;
  name: string;
  description?: string;
  /** Consuming module domain key — engine is domain-agnostic. */
  domain: string;
  version: number;
  status: DecisionDefinitionStatus;
  engineMode: DecisionEngineMode;
  evidenceRequirements: EvidenceRequirementDefinition[];
  rules: DecisionRuleDefinition[];
  recommendationOptions: RecommendationOptionDefinition[];
  scoringProfile?: ScoringProfileDefinition;
  sortOrder?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface DecisionRegistrySnapshot {
  definitions: DecisionDefinition[];
  domains: string[];
  registeredAt: string;
}

/** Single collected evidence item. */
export interface EvidenceItem {
  key: string;
  label?: string;
  value: unknown;
  source: string;
  collectedAt: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

/** Aggregated evidence bundle for a decision execution. */
export interface CollectedEvidence {
  items: EvidenceItem[];
  /** Ratio of satisfied requirements (0–1). */
  completeness: number;
  missingRequired: string[];
}

export interface AppliedRule {
  ruleKey: string;
  label: string;
  matched: boolean;
  weight: number;
  outcomeKey?: string;
  reason?: string;
}

export interface Recommendation {
  outcomeKey: string;
  actionKey: string;
  label: string;
  description?: string;
  score: number;
  priority?: RecommendationPriority;
  metadata?: Record<string, unknown>;
}

export interface AlternativeRecommendation {
  outcomeKey: string;
  actionKey: string;
  label: string;
  description?: string;
  score: number;
  rank: number;
  tradeoffs?: string[];
  metadata?: Record<string, unknown>;
}

export interface ConfidenceFactor {
  key: string;
  label: string;
  contribution: number;
  reason?: string;
}

export interface ConfidenceScore {
  value: number;
  level: ConfidenceLevel;
  factors: ConfidenceFactor[];
}

export interface DecisionExplanation {
  summary: string;
  whatHappened?: string;
  whyItMatters?: string;
  keyFactors: string[];
  rulesSummary?: string[];
  evidenceSummary?: string[];
  caveats?: string[];
}

/** Full decision output — uniform regardless of rule or AI-assisted resolution. */
export interface DecisionResult {
  decisionType: string;
  inputs: Record<string, unknown>;
  collectedEvidence: CollectedEvidence;
  rulesApplied: AppliedRule[];
  recommendation: Recommendation;
  alternativeRecommendations: AlternativeRecommendation[];
  confidence: ConfidenceScore;
  explanation: DecisionExplanation;
  executionTimestamp: string;
  engineVersion: string;
  executionId: string;
  engineMode: DecisionEngineMode;
}

export interface DecisionAuditEntry {
  executionId: string;
  decisionType: string;
  domain: string;
  engineMode: DecisionEngineMode;
  actorUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  schoolId?: string | null;
  organizationId?: string | null;
  summary: string;
  result: DecisionResult;
  metadata?: Record<string, unknown>;
  recordedAt: string;
}

export interface ExecuteDecisionInput {
  decisionType: string;
  inputs: Record<string, unknown>;
  organizationId?: string;
  schoolId?: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ScoredOutcome {
  outcomeKey: string;
  score: number;
  components: Record<string, number>;
}

export interface ScoringResult {
  rankedOutcomes: ScoredOutcome[];
  primaryOutcomeKey: string;
}
