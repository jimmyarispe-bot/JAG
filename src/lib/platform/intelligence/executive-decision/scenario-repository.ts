/**
 * Executive Decision Intelligence — ScenarioRepository (Sprint 026).
 */

import type { ScenarioRepository as ScenarioRepositoryContract } from "@/lib/platform/intelligence/executive-decision/contracts";
import type {
  DecisionScenarioDefinition,
  GraphScope,
} from "@/lib/platform/intelligence/executive-decision/types";

function scopeKey(scope?: Partial<GraphScope> | null): string {
  return [
    scope?.organizationId ?? "org:null",
    scope?.schoolId ?? "school:null",
    scope?.regionId ?? "region:null",
    scope?.campusId ?? "campus:null",
  ].join("|");
}

/**
 * ScenarioRepository — in-memory scenario definition store.
 */
export class ScenarioRepositoryStore implements ScenarioRepositoryContract {
  private readonly byId = new Map<string, DecisionScenarioDefinition>();

  save(scenario: DecisionScenarioDefinition): DecisionScenarioDefinition {
    this.byId.set(scenario.id, scenario);
    return scenario;
  }

  get(scenarioId: string): DecisionScenarioDefinition | null {
    return this.byId.get(scenarioId) ?? null;
  }

  list(scope?: Partial<GraphScope>): DecisionScenarioDefinition[] {
    const all = Array.from(this.byId.values());
    if (!scope) return all;
    const key = scopeKey(scope);
    return all.filter((s) => scopeKey(s.scope) === key);
  }

  remove(scenarioId: string): boolean {
    return this.byId.delete(scenarioId);
  }

  clear(): void {
    this.byId.clear();
  }
}

/** Alias matching Sprint 026 naming. */
export { ScenarioRepositoryStore as ScenarioRepository };
