/**
 * Default replaceable pipeline stages — composition only.
 */

import {
  buildEvidenceBundle,
  collectEvidenceGraph,
  validateEvidenceGraph,
} from "@/jag/intelligence/evidence";
import { composeReasoningPipeline } from "@/jag/intelligence/pipeline";
import { validateProviderResponse } from "@/jag/intelligence/providers";
import { validateExecutiveQuestion } from "@/jag/intelligence/validation";
import { assembleExecutiveAnswer } from "@/jag/intelligence/orchestrator/assemble-answer";
import {
  noteExecution,
} from "@/jag/intelligence/orchestrator/execution-context";
import {
  orchestratorFailure,
} from "@/jag/intelligence/orchestrator/failures";
import type {
  OrchestratorHostBindings,
  PipelineStage,
  PipelineState,
} from "@/jag/intelligence/orchestrator/types";

export const ORCHESTRATOR_STAGE_IDS = Object.freeze([
  "resolve_context",
  "collect_evidence",
  "build_evidence_graph",
  "compose_reasoning_plan",
  "select_provider",
  "execute_provider",
  "validate_response",
  "assemble_answer",
] as const);

export type OrchestratorStageId = (typeof ORCHESTRATOR_STAGE_IDS)[number];

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout: () => Error
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(onTimeout()), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export function createDefaultOrchestratorStages(
  bindings: OrchestratorHostBindings
): PipelineStage[] {
  const minEvidence = bindings.minEvidenceCount ?? 1;
  const timeoutMs = bindings.providerTimeoutMs ?? 30_000;
  const maxAttempts = bindings.maxProviderAttempts ?? 1;
  const sleep =
    bindings.sleep ??
    ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const requirement = bindings.capabilityRequirement ?? {
    structuredOutput: true,
  };

  const resolveContext: PipelineStage = {
    id: "resolve_context",
    label: "Resolve Context",
    async run(state) {
      const qCheck = validateExecutiveQuestion(state.question);
      if (!qCheck.ok) {
        return {
          ok: false,
          failure: orchestratorFailure(
            "invalid_question",
            "Executive question failed validation",
            {
              stageId: "resolve_context",
              details: qCheck.issues.map((i) => i.message),
            }
          ),
        };
      }
      try {
        state.context = await bindings.resolveContext(
          state.question,
          state.execution
        );
        if (!state.context.organizationId) {
          return {
            ok: false,
            failure: orchestratorFailure(
              "context_resolution_error",
              "Resolved context missing organizationId",
              { stageId: "resolve_context" }
            ),
          };
        }
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          failure: orchestratorFailure(
            "context_resolution_error",
            error instanceof Error ? error.message : "Context resolution failed",
            { stageId: "resolve_context" }
          ),
        };
      }
    },
  };

  const collectEvidence: PipelineStage = {
    id: "collect_evidence",
    label: "Collect Evidence",
    async run(state) {
      if (!state.context) {
        return {
          ok: false,
          failure: orchestratorFailure(
            "context_resolution_error",
            "Context required before evidence collection",
            { stageId: "collect_evidence" }
          ),
        };
      }
      try {
        const collected = await bindings.collectEvidenceSeeds(
          state.question,
          state.context,
          state.execution
        );
        state.evidenceSeeds = collected.seeds;
        state.declaredLinks = collected.declaredLinks;
        state.execution.metadata.evidenceCount = collected.seeds.length;
        if (collected.seeds.length < minEvidence) {
          return {
            ok: false,
            failure: orchestratorFailure(
              "insufficient_evidence",
              `Insufficient evidence seeds (need ≥ ${minEvidence})`,
              { stageId: "collect_evidence" }
            ),
          };
        }
        noteExecution(
          state.execution,
          `Collected ${collected.seeds.length} evidence seed(s)`
        );
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          failure: orchestratorFailure(
            "insufficient_evidence",
            error instanceof Error ? error.message : "Evidence collection failed",
            { stageId: "collect_evidence" }
          ),
        };
      }
    },
  };

  const buildEvidenceGraph: PipelineStage = {
    id: "build_evidence_graph",
    label: "Build Evidence Graph",
    run(state) {
      const result = collectEvidenceGraph({
        organizationId: state.context?.organizationId,
        graphId: `graph.${state.execution.requestId}`,
        seeds: state.evidenceSeeds ?? [],
        declaredLinks: state.declaredLinks,
      });
      if (!result.ok || !result.graph) {
        return {
          ok: false,
          failure: orchestratorFailure(
            "evidence_graph_error",
            "Evidence graph construction failed",
            {
              stageId: "build_evidence_graph",
              details: result.issues.map((i) => i.message),
            }
          ),
        };
      }
      const graphCheck = validateEvidenceGraph(result.graph);
      if (!graphCheck.ok) {
        return {
          ok: false,
          failure: orchestratorFailure(
            "evidence_graph_error",
            "Evidence graph validation failed",
            {
              stageId: "build_evidence_graph",
              details: graphCheck.issues.map((i) => i.message),
            }
          ),
        };
      }
      state.evidenceGraph = result.graph;
      state.evidenceBundle = buildEvidenceBundle(result.graph);
      state.curatedEvidence = state.evidenceBundle.evidence;
      state.execution.metadata.graphNodeCount = result.graph.nodes.length;
      state.execution.metadata.graphEdgeCount = result.graph.edges.length;
      noteExecution(
        state.execution,
        `Evidence graph nodes=${result.graph.nodes.length} edges=${result.graph.edges.length}`
      );
      return { ok: true };
    },
  };

  const composePlan: PipelineStage = {
    id: "compose_reasoning_plan",
    label: "Compose Reasoning Plan",
    run(state) {
      if (!state.context) {
        return {
          ok: false,
          failure: orchestratorFailure(
            "context_resolution_error",
            "Context required to compose plan",
            { stageId: "compose_reasoning_plan" }
          ),
        };
      }
      state.plan = composeReasoningPipeline(state.question, state.context);
      return { ok: true };
    },
  };

  const selectProvider: PipelineStage = {
    id: "select_provider",
    label: "Select Provider",
    run(state) {
      const matches = [...bindings.registry.findByCapabilities(requirement)].sort(
        (a, b) => a.id.localeCompare(b.id)
      );
      if (matches.length === 0) {
        return {
          ok: false,
          failure: orchestratorFailure(
            "no_compatible_provider",
            "No provider satisfies capability requirements",
            { stageId: "select_provider" }
          ),
        };
      }
      state.provider = matches[0];
      state.execution.metadata.providerSelectedId = state.provider.id;
      noteExecution(
        state.execution,
        `Selected provider ${state.provider.id}`
      );
      return { ok: true };
    },
  };

  const executeProvider: PipelineStage = {
    id: "execute_provider",
    label: "Execute Provider",
    async run(state) {
      if (!state.provider || !state.plan || !state.context || !state.curatedEvidence) {
        return {
          ok: false,
          failure: orchestratorFailure(
            "provider_execution_error",
            "Missing provider, plan, context, or evidence for execution",
            { stageId: "execute_provider" }
          ),
        };
      }

      let lastError: unknown;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (attempt > 1) {
          state.execution.metadata.retryCount += 1;
          await sleep(10 * (attempt - 1));
        }
        try {
          const resultPromise = Promise.resolve(
            state.provider.reason({
              question: state.question,
              context: state.context,
              evidence: state.curatedEvidence,
              plan: state.plan,
              correlationId: state.execution.correlationId,
            })
          );
          state.providerResponse = await withTimeout(
            resultPromise,
            timeoutMs,
            () =>
              Object.assign(new Error("Provider timed out"), {
                name: "ProviderTimeoutError",
              })
          );
          noteExecution(
            state.execution,
            `Provider execution succeeded on attempt ${attempt}`
          );
          return { ok: true };
        } catch (error) {
          lastError = error;
          const isTimeout =
            error instanceof Error &&
            (error.name === "ProviderTimeoutError" ||
              /timed out/i.test(error.message));
          if (isTimeout && attempt === maxAttempts) {
            return {
              ok: false,
              failure: orchestratorFailure(
                "provider_timeout",
                `Provider exceeded ${timeoutMs}ms`,
                { stageId: "execute_provider" }
              ),
            };
          }
          if (attempt === maxAttempts) {
            return {
              ok: false,
              failure: orchestratorFailure(
                isTimeout ? "provider_timeout" : "provider_execution_error",
                error instanceof Error
                  ? error.message
                  : "Provider execution failed",
                { stageId: "execute_provider" }
              ),
            };
          }
        }
      }
      return {
        ok: false,
        failure: orchestratorFailure(
          "provider_execution_error",
          lastError instanceof Error
            ? lastError.message
            : "Provider execution failed",
          { stageId: "execute_provider" }
        ),
      };
    },
  };

  const validateResponse: PipelineStage = {
    id: "validate_response",
    label: "Validate Response",
    run(state) {
      if (!state.providerResponse) {
        state.execution.metadata.validationStatus = "failed";
        return {
          ok: false,
          failure: orchestratorFailure(
            "validation_failure",
            "No provider response to validate",
            { stageId: "validate_response" }
          ),
        };
      }
      const check = validateProviderResponse(state.providerResponse);
      if (!check.ok) {
        state.execution.metadata.validationStatus = "failed";
        return {
          ok: false,
          failure: orchestratorFailure(
            "validation_failure",
            "Provider response failed EI validation",
            {
              stageId: "validate_response",
              details: check.issues.map((i) => i.message),
            }
          ),
        };
      }
      state.execution.metadata.validationStatus = "passed";
      return { ok: true };
    },
  };

  const assembleAnswer: PipelineStage = {
    id: "assemble_answer",
    label: "Assemble Answer",
    run(state) {
      if (
        !state.plan ||
        !state.providerResponse ||
        !state.curatedEvidence
      ) {
        return {
          ok: false,
          failure: orchestratorFailure(
            "validation_failure",
            "Cannot assemble answer without plan, response, and evidence",
            { stageId: "assemble_answer" }
          ),
        };
      }
      state.answer = assembleExecutiveAnswer({
        requestId: state.execution.requestId,
        question: state.question,
        plan: state.plan,
        evidence: state.curatedEvidence,
        providerResponse: state.providerResponse,
      });
      return { ok: true };
    },
  };

  return [
    resolveContext,
    collectEvidence,
    buildEvidenceGraph,
    composePlan,
    selectProvider,
    executeProvider,
    validateResponse,
    assembleAnswer,
  ];
}
