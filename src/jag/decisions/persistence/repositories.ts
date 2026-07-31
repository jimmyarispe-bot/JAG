/**
 * Persistence contracts only — no SQL, no drivers in this sprint.
 */

import type {
  DecisionDefinition,
  DecisionEvent,
  DecisionId,
  DecisionMetrics,
  DecisionResult,
} from "@/jag/decisions/contracts/definitions";

export type DecisionRepository = {
  readonly saveDefinition: (definition: DecisionDefinition) => Promise<void>;
  readonly findDefinition: (
    decisionId: DecisionId
  ) => Promise<DecisionDefinition | null>;
};

export type DecisionAuditRepository = {
  readonly append: (input: {
    decisionId: DecisionId;
    organizationId: string;
    result: DecisionResult;
    at: string;
  }) => Promise<void>;
  readonly list: (input: {
    decisionId: DecisionId;
    organizationId?: string;
  }) => Promise<readonly DecisionEvent[]>;
};

export type DecisionMetricsRepository = {
  readonly record: (metrics: DecisionMetrics) => Promise<void>;
  readonly summarize: (
    decisionId: DecisionId
  ) => Promise<{ readonly evaluations: number; readonly avgDurationMs: number }>;
};

export type DecisionPersistencePorts = {
  readonly decisions?: DecisionRepository;
  readonly audit?: DecisionAuditRepository;
  readonly metrics?: DecisionMetricsRepository;
};
