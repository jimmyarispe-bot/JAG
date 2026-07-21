/**
 * Decision Intelligence — Sprint 064 / 0.1.0
 *
 * Transforms organizational intelligence into multi-option decision support.
 * Soft-reads briefing + executive-memory lights. Hard DAG predecessor: executive-memory.
 *
 * Path is `decision-intelligence` (not `decision/`) — early cognitive
 * DecisionResolver at `intelligence/decision` remains frozen.
 */

export * from "@/lib/platform/intelligence/decision-intelligence/types";
export * from "@/lib/platform/intelligence/decision-intelligence/registry";
export * from "@/lib/platform/intelligence/decision-intelligence/scoring";
export * from "@/lib/platform/intelligence/decision-intelligence/policies/policy-engine";
export * from "@/lib/platform/intelligence/decision-intelligence/explainability/explain";
export * from "@/lib/platform/intelligence/decision-intelligence/engine/option-generator";
export * from "@/lib/platform/intelligence/decision-intelligence/engine/evaluation-engine";
export * from "@/lib/platform/intelligence/decision-intelligence/engine/recommendation-engine";
export * from "@/lib/platform/intelligence/decision-intelligence/engine/decision-engine";
export * from "@/lib/platform/intelligence/decision-intelligence/services/decision-service";

import { DecisionIntelligenceEngine } from "@/lib/platform/intelligence/decision-intelligence/engine/decision-engine";
import {
  DecisionIntelligenceService,
  type DecisionServiceDependencies,
} from "@/lib/platform/intelligence/decision-intelligence/services/decision-service";

export interface DecisionIntelligenceStack {
  service: DecisionIntelligenceService;
  engine: DecisionIntelligenceEngine;
}

export interface CreateDecisionIntelligenceOptions extends DecisionServiceDependencies {}

export function createDecisionIntelligence(
  options: CreateDecisionIntelligenceOptions = {}
): DecisionIntelligenceStack {
  const engine = options.engine ?? new DecisionIntelligenceEngine(options);
  const service = new DecisionIntelligenceService({ ...options, engine });
  return { service, engine };
}
