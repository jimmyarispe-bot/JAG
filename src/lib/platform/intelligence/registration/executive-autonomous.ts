/**
 * Autonomous Intelligence stack registration (Sprint 066 — after executive-predictive).
 */

import {
  createExecutiveAutonomousIntelligence,
  type ExecutiveAutonomousStack,
} from "@/lib/platform/intelligence/executive-autonomous";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface ExecutiveAutonomousStacks {
  executiveAutonomous: ExecutiveAutonomousStack;
}

export function registerExecutiveAutonomousStacks(
  options: CreateIntelligenceServiceOptions,
  _wiring: DnaOiosWiring
): ExecutiveAutonomousStacks {
  const executiveAutonomous =
    options.executiveAutonomous ??
    createExecutiveAutonomousIntelligence({
      ...(options.executiveAutonomousOptions ?? {}),
    });

  return { executiveAutonomous };
}
