/**
 * Digital Twin stack registration (Sprint 071 — after portfolio-intelligence).
 */

import {
  createDigitalTwin,
  type DigitalTwinStack,
} from "@/lib/platform/intelligence/digital-twin";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface DigitalTwinStacks {
  digitalTwin: DigitalTwinStack;
}

export function registerDigitalTwinStacks(
  options: CreateIntelligenceServiceOptions,
  _wiring: DnaOiosWiring
): DigitalTwinStacks {
  const digitalTwin =
    options.digitalTwin ??
    createDigitalTwin({
      ...(options.digitalTwinOptions ?? {}),
    });

  return { digitalTwin };
}
