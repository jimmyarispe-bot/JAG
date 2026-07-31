/**
 * JAG Decision Engine — immutable core contracts.
 * Industry-agnostic: no domain-specific terminology.
 */

export type DecisionId = string;
export type PolicyId = string;
export type RuleId = string;

export type DecisionConditionOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "not_in"
  | "exists"
  | "not_exists"
  | "truthy"
  | "falsy";

export type DecisionCondition = {
  readonly path: string;
  readonly operator: DecisionConditionOperator;
  readonly value?: unknown;
};

/** Atomic rule — declarative only; no executable package code. */
export type DecisionRule = {
  readonly id: RuleId;
  readonly label?: string;
  /** Higher priority wins within a policy when using priority conflict strategy. */
  readonly priority: number;
  readonly conditions: readonly DecisionCondition[];
  /** Outcome token applied when all conditions match. */
  readonly outcome: string;
  readonly rationale?: string;
  /** When matched: stop policy (default) or continue evaluating siblings. */
  readonly onMatch?: "stop" | "continue";
};

export type DecisionConflictStrategy =
  | "first_match"
  | "last_match"
  | "highest_priority"
  | "deny_overrides"
  | "permit_overrides";

export type DecisionPolicy = {
  readonly id: PolicyId;
  readonly label: string;
  readonly description?: string;
  /** Higher precedence policies are evaluated earlier. */
  readonly precedence: number;
  readonly enabled?: boolean;
  readonly rules: readonly DecisionRule[];
  readonly conflictStrategy?: DecisionConflictStrategy;
  /** Optional rule group id for documentation / filtering. */
  readonly groupId?: string;
};

export type DecisionDefinition = {
  readonly id: DecisionId;
  readonly applicationId: string;
  readonly version: string;
  readonly label: string;
  readonly description?: string;
  readonly policies: readonly DecisionPolicy[];
  /** Outcome when no rule matches. */
  readonly defaultOutcome: string;
  readonly dependsOn?: readonly DecisionId[];
  readonly metadata?: Readonly<Record<string, unknown>>;
  /**
   * Extension references by id only — resolved through DecisionExtensionPorts.
   */
  readonly extensions?: Readonly<{
    processDefinitionIds?: readonly string[];
    workflowDefinitionIds?: readonly string[];
    formDefinitionIds?: readonly string[];
    entityTypeIds?: readonly string[];
    intelligencePackIds?: readonly string[];
    communicationTemplateIds?: readonly string[];
  }>;
};

/** Facts supplied by the caller (other engines / packages via facades). */
export type DecisionInput = {
  readonly decisionId: DecisionId;
  readonly organizationId: string;
  readonly actorUserId?: string;
  readonly facts: Readonly<Record<string, unknown>>;
  /** Optional simulation flag — runtime also exposes simulate(). */
  readonly mode?: "evaluate" | "simulate";
};

export type DecisionContext = {
  readonly organizationId: string;
  readonly actorUserId?: string;
  readonly decisionId: DecisionId;
  readonly facts: Readonly<Record<string, unknown>>;
  readonly now: () => Date;
  readonly mode: "evaluate" | "simulate";
};

export type DecisionReason = {
  readonly code: string;
  readonly message: string;
  readonly policyId?: PolicyId;
  readonly ruleId?: RuleId;
  readonly path?: string;
};

export type DecisionExplanation = {
  readonly outcome: string;
  readonly defaultApplied: boolean;
  readonly contributingRules: readonly {
    readonly policyId: PolicyId;
    readonly ruleId: RuleId;
    readonly outcome: string;
    readonly rationale?: string;
    readonly priority: number;
  }[];
  readonly unmetConditions: readonly {
    readonly policyId: PolicyId;
    readonly ruleId: RuleId;
    readonly path: string;
    readonly operator: DecisionConditionOperator;
    readonly expected?: unknown;
    readonly actual?: unknown;
  }[];
  /** Ordered rationale steps — machine-readable, no LLM. */
  readonly rationaleChain: readonly DecisionReason[];
  readonly confidence?: {
    readonly score: number;
    readonly basis: string;
  };
};

export type DecisionResult = {
  readonly ok: boolean;
  readonly outcome?: string;
  readonly explanation?: DecisionExplanation;
  readonly error?: { readonly code: string; readonly message: string };
  readonly events?: readonly DecisionEvent[];
  readonly metrics?: DecisionMetrics;
  readonly simulated?: boolean;
};

export type DecisionMetrics = {
  readonly decisionId: DecisionId;
  readonly evaluatedAt: string;
  readonly durationMs: number;
  readonly policiesEvaluated: number;
  readonly rulesEvaluated: number;
  readonly rulesMatched: number;
  readonly cacheHit: boolean;
};

export type DecisionEventType =
  | "decision.evaluated"
  | "decision.simulated"
  | "decision.explained"
  | "decision.validated"
  | "decision.compared"
  | "policy.changed"
  | "rule.executed"
  | "explanation.generated";

export type DecisionEvent = {
  readonly id: string;
  readonly type: DecisionEventType;
  readonly decisionId: DecisionId;
  readonly occurredAt: string;
  readonly organizationId?: string;
  readonly actorUserId?: string;
  readonly data?: Readonly<Record<string, unknown>>;
};
