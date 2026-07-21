/**
 * Autonomous Intelligence — Sprint 066 / 0.1.0
 *
 * Transforms recommendations into prepared execution plans.
 * Humans approve. The system never auto-executes organizational actions.
 *
 * Module id: executive-autonomous
 * Hard DAG predecessor: executive-predictive
 */

export * from "@/lib/platform/intelligence/executive-autonomous/types";
export * from "@/lib/platform/intelligence/executive-autonomous/registry";
export * from "@/lib/platform/intelligence/executive-autonomous/approvals/policies";
export * from "@/lib/platform/intelligence/executive-autonomous/approvals/routing";
export * from "@/lib/platform/intelligence/executive-autonomous/planning/dependencies";
export * from "@/lib/platform/intelligence/executive-autonomous/planning/sequencing";
export * from "@/lib/platform/intelligence/executive-autonomous/planning/rollback";
export * from "@/lib/platform/intelligence/executive-autonomous/planning/validation";
export * from "@/lib/platform/intelligence/executive-autonomous/workflows";
export * from "@/lib/platform/intelligence/executive-autonomous/engine/approval-engine";
export * from "@/lib/platform/intelligence/executive-autonomous/engine/execution-planner";
export * from "@/lib/platform/intelligence/executive-autonomous/engine/orchestration-engine";
export * from "@/lib/platform/intelligence/executive-autonomous/engine/autonomous-engine";
export * from "@/lib/platform/intelligence/executive-autonomous/services/autonomous-service";

import { AutonomousEngine } from "@/lib/platform/intelligence/executive-autonomous/engine/autonomous-engine";
import {
  ExecutiveAutonomousService,
  type AutonomousServiceDependencies,
} from "@/lib/platform/intelligence/executive-autonomous/services/autonomous-service";

export interface ExecutiveAutonomousStack {
  service: ExecutiveAutonomousService;
  engine: AutonomousEngine;
}

export interface CreateExecutiveAutonomousOptions extends AutonomousServiceDependencies {}

export function createExecutiveAutonomousIntelligence(
  options: CreateExecutiveAutonomousOptions = {}
): ExecutiveAutonomousStack {
  const engine =
    options.engine ??
    new AutonomousEngine({
      createId: options.createId,
      now: options.now,
    });
  const service = new ExecutiveAutonomousService({ ...options, engine });
  return { service, engine };
}

export const createAutonomousIntelligence = createExecutiveAutonomousIntelligence;
