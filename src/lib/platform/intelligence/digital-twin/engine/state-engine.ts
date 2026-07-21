/**
 * Isolated simulation state management.
 */

import { cloneModel } from "@/lib/platform/intelligence/digital-twin/models/organization-model";
import type {
  OrganizationModel,
  ScenarioDefinition,
  SimulationState,
} from "@/lib/platform/intelligence/digital-twin/types";

export class StateEngine {
  constructor(
    private readonly createId: (prefix: string) => string,
    private readonly now: () => Date
  ) {}

  createIsolated(
    scenario: ScenarioDefinition,
    baseline: OrganizationModel
  ): Pick<SimulationState, "id" | "scenarioId" | "isolated" | "model" | "createdAt"> {
    return {
      id: this.createId("sim"),
      scenarioId: scenario.id,
      isolated: true,
      model: cloneModel(baseline),
      createdAt: this.now().toISOString(),
    };
  }
}
