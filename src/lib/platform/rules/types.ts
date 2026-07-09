/** The JAG Rules Engine — B-10 Phase 1 foundation types */

export const RULE_SET_STATUSES = ["draft", "active", "archived"] as const;
export type RuleSetStatus = (typeof RULE_SET_STATUSES)[number];

export const RULE_EVALUATION_MODES = ["first_match", "all_match", "weighted"] as const;
export type RuleEvaluationMode = (typeof RULE_EVALUATION_MODES)[number];

export const RULE_CONDITION_OPERATORS = [
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
export type RuleConditionOperator = (typeof RULE_CONDITION_OPERATORS)[number];

export interface RuleConditionDefinition {
  key: string;
  field: string;
  operator: RuleConditionOperator;
  value?: unknown;
  logicGroup?: string;
  negate?: boolean;
}

export interface RuleOutcomeDefinition {
  outcomeKey: string;
  label: string;
  description?: string;
  effects?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface RuleDefinition {
  ruleKey: string;
  label: string;
  description?: string;
  conditions?: RuleConditionDefinition[];
  outcomeKey: string;
  weight?: number;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

/** Domain-organized, data-driven rule collection — modules register at import time. */
export interface RuleSetDefinition {
  ruleSetKey: string;
  name: string;
  description?: string;
  domain: string;
  version: number;
  status: RuleSetStatus;
  evaluationMode: RuleEvaluationMode;
  rules: RuleDefinition[];
  outcomes: RuleOutcomeDefinition[];
  sortOrder?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface RuleRegistrySnapshot {
  ruleSets: RuleSetDefinition[];
  domains: string[];
  registeredAt: string;
}

export interface EvaluatedRule {
  ruleKey: string;
  label: string;
  matched: boolean;
  outcomeKey: string;
  weight: number;
  sortOrder: number;
  reason: string;
}

export interface RuleOutcome {
  outcomeKey: string;
  label: string;
  description?: string;
  effects?: Record<string, unknown>;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface RuleExplanation {
  summary: string;
  matchedRuleSummary: string[];
  unmatchedRuleSummary: string[];
  primaryReason: string;
  factsUsed: string[];
}

export interface RuleEvaluationResult {
  evaluationId: string;
  ruleSetKey: string;
  domain: string;
  evaluationMode: RuleEvaluationMode;
  facts: Record<string, unknown>;
  rulesEvaluated: EvaluatedRule[];
  matchedRules: EvaluatedRule[];
  primaryOutcome: RuleOutcome | null;
  allOutcomes: RuleOutcome[];
  explanation: RuleExplanation;
  evaluatedAt: string;
  engineVersion: string;
}

export interface RuleAuditEntry {
  evaluationId: string;
  ruleSetKey: string;
  domain: string;
  evaluationMode: RuleEvaluationMode;
  entityType?: string | null;
  entityId?: string | null;
  organizationId?: string | null;
  schoolId?: string | null;
  actorUserId?: string | null;
  summary: string;
  result: RuleEvaluationResult;
  metadata?: Record<string, unknown>;
  recordedAt: string;
}

export interface EvaluateRuleSetInput {
  ruleSetKey: string;
  facts: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
  organizationId?: string;
  schoolId?: string;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
}
