/**
 * Predictive Intelligence — ForecastRepository (Sprint 028).
 */

import type { ForecastRepository as ForecastRepositoryContract } from "@/lib/platform/intelligence/predictive-intelligence/contracts";
import type {
  GraphScope,
  ScenarioForecast,
} from "@/lib/platform/intelligence/predictive-intelligence/types";

function scopeKey(scope?: Partial<GraphScope> | null): string {
  return [
    scope?.organizationId ?? "org:null",
    scope?.schoolId ?? "school:null",
    scope?.regionId ?? "region:null",
    scope?.campusId ?? "campus:null",
  ].join("|");
}

/**
 * ForecastRepository — in-memory scenario forecast store.
 */
export class ForecastRepositoryStore implements ForecastRepositoryContract {
  private readonly byScenarioId = new Map<string, ScenarioForecast>();
  private readonly byScope = new Map<string, string[]>();

  save(forecast: ScenarioForecast): ScenarioForecast {
    this.byScenarioId.set(forecast.scenario.id, forecast);
    const key = scopeKey(forecast.scenario.scope);
    const list = this.byScope.get(key) ?? [];
    if (!list.includes(forecast.scenario.id)) {
      list.push(forecast.scenario.id);
      this.byScope.set(key, list);
    }
    return forecast;
  }

  get(scenarioId: string): ScenarioForecast | null {
    return this.byScenarioId.get(scenarioId) ?? null;
  }

  list(scope?: Partial<GraphScope>): ScenarioForecast[] {
    if (!scope) {
      return Array.from(this.byScenarioId.values()).sort((a, b) =>
        a.generatedAt < b.generatedAt ? 1 : -1
      );
    }
    const ids = this.byScope.get(scopeKey(scope)) ?? [];
    return ids
      .map((id) => this.byScenarioId.get(id))
      .filter((f): f is ScenarioForecast => Boolean(f))
      .sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1));
  }

  remove(scenarioId: string): boolean {
    return this.byScenarioId.delete(scenarioId);
  }

  clear(): void {
    this.byScenarioId.clear();
    this.byScope.clear();
  }
}

/** Alias matching Sprint 028 naming. */
export { ForecastRepositoryStore as ForecastRepository };
