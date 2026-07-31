/**
 * Orchestrator public types — composition only; no new EI contracts.
 */

import type { ExecutiveAnswer } from "@/jag/intelligence/contracts/answer";
import type { Evidence } from "@/jag/intelligence/contracts/evidence";
import type { ExecutiveQuestion } from "@/jag/intelligence/contracts/question";
import type { IntelligenceContext } from "@/jag/intelligence/contracts/context";
import type {
  DeclaredEvidenceLink,
  EvidenceBundle,
  EvidenceCollectorSeed,
  EvidenceGraph,
} from "@/jag/intelligence/evidence/types";
import type { ReasoningPipelinePlan } from "@/jag/intelligence/pipeline/compose";
import type { CapabilityRequirement } from "@/jag/intelligence/providers/capabilities";
import type { IntelligenceProvider } from "@/jag/intelligence/providers/intelligence-provider";
import type { IntelligenceProviderResponse } from "@/jag/intelligence/providers/response";
import type { ProviderRegistry } from "@/jag/intelligence/providers/registry";
import type { ExecutionContext } from "@/jag/intelligence/orchestrator/execution-context";
import type { OrchestratorFailure } from "@/jag/intelligence/orchestrator/failures";

/** Alias for the public API surface. */
export type Question = ExecutiveQuestion;

export type OrchestratorSuccess = {
  readonly ok: true;
  readonly answer: ExecutiveAnswer;
  readonly execution: ExecutionContext;
};

export type OrchestratorErrorResult = {
  readonly ok: false;
  readonly failure: OrchestratorFailure;
  readonly execution: ExecutionContext;
};

/** Structured answer envelope (success or failure). */
export type Answer = OrchestratorSuccess | OrchestratorErrorResult;

export type PipelineState = {
  question: ExecutiveQuestion;
  execution: ExecutionContext;
  context?: IntelligenceContext;
  evidenceSeeds?: readonly EvidenceCollectorSeed[];
  declaredLinks?: readonly DeclaredEvidenceLink[];
  evidenceGraph?: EvidenceGraph;
  evidenceBundle?: EvidenceBundle;
  plan?: ReasoningPipelinePlan;
  provider?: IntelligenceProvider;
  providerResponse?: IntelligenceProviderResponse;
  /** Flattened evidence attached to the final answer. */
  curatedEvidence?: readonly Evidence[];
  answer?: ExecutiveAnswer;
  failure?: OrchestratorFailure;
};

export type PipelineStageResult = {
  readonly ok: boolean;
  readonly failure?: OrchestratorFailure;
};

export type PipelineStage = {
  readonly id: string;
  readonly label: string;
  run(state: PipelineState): Promise<PipelineStageResult> | PipelineStageResult;
};

export type OrchestratorHostBindings = {
  /**
   * Resolve organizational IntelligenceContext for the question.
   * Host-owned — orchestrator does not discover org state.
   */
  readonly resolveContext: (
    question: ExecutiveQuestion,
    execution: ExecutionContext
  ) => IntelligenceContext | Promise<IntelligenceContext>;

  /**
   * Supply curated evidence seeds for the Evidence Graph.
   * Host-owned — orchestrator does not perform evidence discovery.
   */
  readonly collectEvidenceSeeds: (
    question: ExecutiveQuestion,
    context: IntelligenceContext,
    execution: ExecutionContext
  ) =>
    | {
        readonly seeds: readonly EvidenceCollectorSeed[];
        readonly declaredLinks?: readonly DeclaredEvidenceLink[];
      }
    | Promise<{
        readonly seeds: readonly EvidenceCollectorSeed[];
        readonly declaredLinks?: readonly DeclaredEvidenceLink[];
      }>;

  /** Injected provider registry — implementations supplied by host. */
  readonly registry: ProviderRegistry;

  readonly capabilityRequirement?: CapabilityRequirement;
  readonly providerTimeoutMs?: number;
  readonly maxProviderAttempts?: number;
  readonly minEvidenceCount?: number;

  readonly userId?: string;
  readonly sessionId?: string;
  readonly organizationId?: string;

  readonly now?: () => Date;
  readonly createId?: () => string;
  readonly sleep?: (ms: number) => Promise<void>;

  /** Replaceable stage list; defaults to canonical ordered stages. */
  readonly stages?: readonly PipelineStage[];
};
