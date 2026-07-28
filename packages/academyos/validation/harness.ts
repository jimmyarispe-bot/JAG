import type {
  AssertionSeverity,
  PerformanceSample,
  ValidationAssertion,
  ValidationDomain,
  ValidationScenarioId,
  ValidationScenarioResult,
} from "./types";

export type ScenarioContext = {
  readonly organizationId: string;
  readonly organizationIds: readonly string[];
  assert(
    name: string,
    ok: boolean,
    detail?: string,
    severity?: AssertionSeverity
  ): void;
  measure<T>(name: string, fn: () => T): T;
  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T>;
};

export type ScenarioDefinition = {
  readonly id: ValidationScenarioId;
  readonly name: string;
  readonly domains: readonly ValidationDomain[];
  readonly run: (ctx: ScenarioContext) => void | Promise<void>;
};

export function createScenarioContext(input: {
  organizationId: string;
  organizationIds: readonly string[];
}): {
  ctx: ScenarioContext;
  getAssertions: () => ValidationAssertion[];
  getPerformance: () => PerformanceSample[];
} {
  const assertions: ValidationAssertion[] = [];
  const performance: PerformanceSample[] = [];

  const ctx: ScenarioContext = {
    organizationId: input.organizationId,
    organizationIds: input.organizationIds,
    assert(name, ok, detail, severity = ok ? "minor" : "critical") {
      assertions.push({
        name,
        ok,
        detail,
        severity: ok ? "minor" : severity,
      });
    },
    measure(name, fn) {
      const start = performanceNow();
      try {
        return fn();
      } finally {
        performance.push({
          name,
          durationMs: roundMs(performanceNow() - start),
          organizationId: input.organizationId,
        });
      }
    },
    async measureAsync(name, fn) {
      const start = performanceNow();
      try {
        return await fn();
      } finally {
        performance.push({
          name,
          durationMs: roundMs(performanceNow() - start),
          organizationId: input.organizationId,
        });
      }
    },
  };

  return {
    ctx,
    getAssertions: () => assertions,
    getPerformance: () => performance,
  };
}

export async function executeScenario(
  def: ScenarioDefinition,
  organizationId: string,
  organizationIds: readonly string[]
): Promise<ValidationScenarioResult> {
  const { ctx, getAssertions, getPerformance } = createScenarioContext({
    organizationId,
    organizationIds,
  });
  const started = performanceNow();
  const ranAt = new Date().toISOString();
  try {
    await def.run(ctx);
  } catch (err) {
    ctx.assert(
      "scenario.uncaught",
      false,
      err instanceof Error ? err.message : String(err),
      "blocker"
    );
  }
  const assertions = getAssertions();
  const blockers = assertions
    .filter((a) => !a.ok && (a.severity === "blocker" || a.severity === "critical"))
    .map((a) => `${a.name}: ${a.detail ?? "failed"}`);
  const passed = assertions.length > 0 && assertions.every((a) => a.ok);

  return {
    id: def.id,
    name: def.name,
    domains: def.domains,
    organizationIds,
    passed,
    assertions: Object.freeze(assertions),
    durationMs: roundMs(performanceNow() - started),
    performance: Object.freeze(getPerformance()),
    blockers: Object.freeze(blockers),
    ranAt,
  };
}

function performanceNow(): number {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

function roundMs(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isOk<T extends object>(
  value: T | { error: string } | null | undefined
): value is T {
  if (value == null) return false;
  return !("error" in value);
}
