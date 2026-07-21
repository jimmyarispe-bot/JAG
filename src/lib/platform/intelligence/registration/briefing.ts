/**
 * Executive Briefing stack registration (Sprint 062 — after synthesis).
 */

import {
  createBriefingIntelligence,
  type BriefingStack,
} from "@/lib/platform/intelligence/briefing";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface BriefingStacks {
  briefing: BriefingStack;
}

export function registerBriefingStacks(
  options: CreateIntelligenceServiceOptions,
  _wiring: DnaOiosWiring
): BriefingStacks {
  const briefing =
    options.briefing ??
    createBriefingIntelligence({
      ...(options.briefingOptions ?? {}),
    });

  return { briefing };
}
