/**
 * Initiative Intelligence — Sprint 069 / 0.1.0
 *
 * Organizational execution layer: approved recommendations → living initiatives
 * with measurable progress, connected to the executive intelligence stack.
 *
 * Distinct from frozen helpers in domains/strategic, execution/initiatives,
 * board-governance strategic-initiative-tracker, and executive-memory entities.
 *
 * Module id: initiative-intelligence
 * Hard DAG predecessor: executive-command-center
 */

export * from "@/lib/platform/intelligence/initiative-intelligence/types";
export * from "@/lib/platform/intelligence/initiative-intelligence/registry";
export * from "@/lib/platform/intelligence/initiative-intelligence/planning/objectives";
export * from "@/lib/platform/intelligence/initiative-intelligence/planning/kpis";
export * from "@/lib/platform/intelligence/initiative-intelligence/planning/owners";
export * from "@/lib/platform/intelligence/initiative-intelligence/planning/budget";
export * from "@/lib/platform/intelligence/initiative-intelligence/planning/milestones";
export * from "@/lib/platform/intelligence/initiative-intelligence/tracking/progress";
export * from "@/lib/platform/intelligence/initiative-intelligence/tracking/blockers";
export * from "@/lib/platform/intelligence/initiative-intelligence/tracking/risks";
export * from "@/lib/platform/intelligence/initiative-intelligence/tracking/timeline";
export * from "@/lib/platform/intelligence/initiative-intelligence/tracking/health";
export * from "@/lib/platform/intelligence/initiative-intelligence/engine/lifecycle-engine";
export * from "@/lib/platform/intelligence/initiative-intelligence/engine/dependency-engine";
export * from "@/lib/platform/intelligence/initiative-intelligence/engine/progress-engine";
export * from "@/lib/platform/intelligence/initiative-intelligence/engine/outcome-engine";
export * from "@/lib/platform/intelligence/initiative-intelligence/engine/initiative-engine";
export * from "@/lib/platform/intelligence/initiative-intelligence/services/initiative-service";

import { InitiativeEngine } from "@/lib/platform/intelligence/initiative-intelligence/engine/initiative-engine";
import {
  InitiativeIntelligenceService,
  type InitiativeServiceDependencies,
} from "@/lib/platform/intelligence/initiative-intelligence/services/initiative-service";

export interface InitiativeIntelligenceStack {
  service: InitiativeIntelligenceService;
  engine: InitiativeEngine;
}

export interface CreateInitiativeIntelligenceOptions extends InitiativeServiceDependencies {}

export function createInitiativeIntelligence(
  options: CreateInitiativeIntelligenceOptions = {}
): InitiativeIntelligenceStack {
  const engine =
    options.engine ??
    new InitiativeEngine({
      createId: options.createId,
      now: options.now,
    });
  const service = new InitiativeIntelligenceService({ ...options, engine });
  return { service, engine };
}

export const createInitiativeIntelligenceStack = createInitiativeIntelligence;
