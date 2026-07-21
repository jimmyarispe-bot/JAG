/**
 * Executive Copilot stack registration (Sprint 067 — after executive-autonomous).
 */

import {
  createExecutiveCopilotIntelligence,
  type ExecutiveCopilotStack,
} from "@/lib/platform/intelligence/executive-copilot";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface ExecutiveCopilotStacks {
  executiveCopilot: ExecutiveCopilotStack;
}

export function registerExecutiveCopilotStacks(
  options: CreateIntelligenceServiceOptions,
  _wiring: DnaOiosWiring
): ExecutiveCopilotStacks {
  const executiveCopilot =
    options.executiveCopilot ??
    createExecutiveCopilotIntelligence({
      ...(options.executiveCopilotOptions ?? {}),
    });

  return { executiveCopilot };
}
