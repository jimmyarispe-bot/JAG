/**
 * Predictive Intelligence — Sprint 065 / 0.1.0
 *
 * Estimates plausible future organizational states from history, signals,
 * and decision context. Advisory only — not guarantees.
 *
 * Package path is `executive-predictive` (module id `executive-predictive`)
 * because Sprint 028 already owns `predictive-intelligence/` (module `predictive`).
 *
 * Soft-reads decision-intelligence + executive-memory + briefing lights.
 * Hard DAG predecessor: decision-intelligence.
 */

export * from "@/lib/platform/intelligence/executive-predictive/types";
export * from "@/lib/platform/intelligence/executive-predictive/registry";
export * from "@/lib/platform/intelligence/executive-predictive/confidence/confidence";
export * from "@/lib/platform/intelligence/executive-predictive/explainability/explain";
export * from "@/lib/platform/intelligence/executive-predictive/forecasting/shared";
export * from "@/lib/platform/intelligence/executive-predictive/forecasting/enrollment";
export * from "@/lib/platform/intelligence/executive-predictive/forecasting/finance";
export * from "@/lib/platform/intelligence/executive-predictive/forecasting/staffing";
export * from "@/lib/platform/intelligence/executive-predictive/forecasting/operations";
export * from "@/lib/platform/intelligence/executive-predictive/forecasting/compliance";
export * from "@/lib/platform/intelligence/executive-predictive/scenarios/best-case";
export * from "@/lib/platform/intelligence/executive-predictive/scenarios/expected";
export * from "@/lib/platform/intelligence/executive-predictive/scenarios/worst-case";
export * from "@/lib/platform/intelligence/executive-predictive/scenarios/custom";
export * from "@/lib/platform/intelligence/executive-predictive/engine/forecast-engine";
export * from "@/lib/platform/intelligence/executive-predictive/engine/scenario-engine";
export * from "@/lib/platform/intelligence/executive-predictive/engine/signal-engine";
export * from "@/lib/platform/intelligence/executive-predictive/engine/decision-impact";
export * from "@/lib/platform/intelligence/executive-predictive/engine/drift";
export * from "@/lib/platform/intelligence/executive-predictive/engine/predictive-engine";
export * from "@/lib/platform/intelligence/executive-predictive/services/predictive-service";

import { PredictiveEngine } from "@/lib/platform/intelligence/executive-predictive/engine/predictive-engine";
import {
  ExecutivePredictiveService,
  type PredictiveServiceDependencies,
} from "@/lib/platform/intelligence/executive-predictive/services/predictive-service";

export interface ExecutivePredictiveStack {
  service: ExecutivePredictiveService;
  engine: PredictiveEngine;
}

export interface CreateExecutivePredictiveOptions extends PredictiveServiceDependencies {}

export function createExecutivePredictiveIntelligence(
  options: CreateExecutivePredictiveOptions = {}
): ExecutivePredictiveStack {
  const engine =
    options.engine ??
    new PredictiveEngine({
      createId: options.createId,
      now: options.now,
    });
  const service = new ExecutivePredictiveService({ ...options, engine });
  return { service, engine };
}

/** Display alias used in docs / UI copy. */
export const createPredictiveIntelligenceSprint065 =
  createExecutivePredictiveIntelligence;
