/**
 * Reasoning pipeline stages — declarative descriptors only.
 * No AI provider calls. No runtime/compiler execution.
 */

import type { DecisionTraceStepKind } from "@/jag/intelligence/contracts/decision-trace";

export type ReasoningPipelineStageId = DecisionTraceStepKind;

export type ReasoningPipelineStage = {
  readonly id: ReasoningPipelineStageId;
  readonly label: string;
  readonly description: string;
  readonly order: number;
};

/** Canonical ordered pipeline for Executive Intelligence Foundation v1. */
export const REASONING_PIPELINE_STAGES: readonly ReasoningPipelineStage[] =
  Object.freeze([
    Object.freeze({
      id: "intent_classification" as const,
      label: "Intent Classification",
      description:
        "Classify the executive question into a supported intent (status, risk, compliance, …).",
      order: 1,
    }),
    Object.freeze({
      id: "capability_discovery" as const,
      label: "Capability Discovery",
      description:
        "Identify relevant capability packs, modules, and definition catalogs in scope.",
      order: 2,
    }),
    Object.freeze({
      id: "evidence_collection" as const,
      label: "Evidence Collection",
      description:
        "Gather grounded references to policies, work, reports, analytics, decisions, and documents.",
      order: 3,
    }),
    Object.freeze({
      id: "cross_capability_correlation" as const,
      label: "Cross-Capability Correlation",
      description:
        "Relate evidence across packs and modules without bypassing the organizational model.",
      order: 4,
    }),
    Object.freeze({
      id: "reasoning" as const,
      label: "Reasoning",
      description:
        "Derive findings from correlated evidence and explicit assumptions.",
      order: 5,
    }),
    Object.freeze({
      id: "explanation" as const,
      label: "Explanation",
      description:
        "Produce an explainable narrative tied to evidence and findings.",
      order: 6,
    }),
    Object.freeze({
      id: "recommendation" as const,
      label: "Recommendations",
      description:
        "Emit grounded recommendations with confidence and decision-trace linkage.",
      order: 7,
    }),
  ]);
