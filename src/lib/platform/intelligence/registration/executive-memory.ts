/**
 * Executive Memory stack registration (Sprint 063 — after briefing).
 */

import {
  createExecutiveMemoryIntelligence,
  type ExecutiveMemoryStack,
} from "@/lib/platform/intelligence/executive-memory";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface ExecutiveMemoryStacks {
  executiveMemory: ExecutiveMemoryStack;
}

export function registerExecutiveMemoryStacks(
  options: CreateIntelligenceServiceOptions,
  _wiring: DnaOiosWiring
): ExecutiveMemoryStacks {
  const executiveMemory =
    options.executiveMemory ??
    createExecutiveMemoryIntelligence({
      ...(options.executiveMemoryOptions ?? {}),
    });

  return { executiveMemory };
}
