/**
 * Executive Command Center stack registration (Sprint 068 — after executive-copilot).
 */

import {
  createExecutiveCommandCenter,
  type ExecutiveCommandCenterStack,
} from "@/lib/platform/intelligence/executive-command-center";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface ExecutiveCommandCenterStacks {
  executiveCommandCenter: ExecutiveCommandCenterStack;
}

export function registerExecutiveCommandCenterStacks(
  options: CreateIntelligenceServiceOptions,
  _wiring: DnaOiosWiring
): ExecutiveCommandCenterStacks {
  const executiveCommandCenter =
    options.executiveCommandCenter ??
    createExecutiveCommandCenter({
      ...(options.executiveCommandCenterOptions ?? {}),
    });

  return { executiveCommandCenter };
}
