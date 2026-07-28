import type { PerformanceSample, ValidationAssertion } from "../validation/types";
import type { HardeningSuiteId, HardeningSuiteResult } from "./types";

export type HardeningContext = {
  readonly organizationId: string;
  readonly organizationIds: readonly string[];
  readonly repositoryRoot: string;
  assert(
    name: string,
    ok: boolean,
    detail?: string,
    severity?: ValidationAssertion["severity"]
  ): void;
  measure<T>(name: string, fn: () => T): T;
};

export type HardeningSuiteDefinition = {
  readonly id: HardeningSuiteId;
  readonly name: string;
  readonly run: (ctx: HardeningContext) => void | Promise<void>;
};

function nowMs(): number {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

function roundMs(n: number): number {
  return Math.round(n * 100) / 100;
}

export function createHardeningContext(input: {
  organizationId: string;
  organizationIds: readonly string[];
  repositoryRoot: string;
}): {
  ctx: HardeningContext;
  getAssertions: () => ValidationAssertion[];
  getPerformance: () => PerformanceSample[];
} {
  const assertions: ValidationAssertion[] = [];
  const performanceSamples: PerformanceSample[] = [];
  const ctx: HardeningContext = {
    organizationId: input.organizationId,
    organizationIds: input.organizationIds,
    repositoryRoot: input.repositoryRoot,
    assert(name, ok, detail, severity = ok ? "minor" : "critical") {
      assertions.push({
        name,
        ok,
        detail,
        severity: ok ? "minor" : severity,
      });
    },
    measure(name, fn) {
      const start = nowMs();
      try {
        return fn();
      } finally {
        performanceSamples.push({
          name,
          durationMs: roundMs(nowMs() - start),
          organizationId: input.organizationId,
        });
      }
    },
  };
  return {
    ctx,
    getAssertions: () => assertions,
    getPerformance: () => performanceSamples,
  };
}

export async function executeHardeningSuite(
  def: HardeningSuiteDefinition,
  organizationId: string,
  organizationIds: readonly string[],
  repositoryRoot: string
): Promise<HardeningSuiteResult> {
  const { ctx, getAssertions, getPerformance } = createHardeningContext({
    organizationId,
    organizationIds,
    repositoryRoot,
  });
  const started = nowMs();
  const ranAt = new Date().toISOString();
  try {
    await def.run(ctx);
  } catch (err) {
    ctx.assert(
      "suite.uncaught",
      false,
      err instanceof Error ? err.message : String(err),
      "blocker"
    );
  }
  const assertions = getAssertions();
  const blockers = assertions
    .filter((a) => !a.ok && (a.severity === "blocker" || a.severity === "critical"))
    .map((a) => `${a.name}: ${a.detail ?? "failed"}`);
  return {
    id: def.id,
    name: def.name,
    passed: assertions.length > 0 && assertions.every((a) => a.ok),
    assertions: Object.freeze(assertions),
    durationMs: roundMs(nowMs() - started),
    performance: Object.freeze(getPerformance()),
    blockers: Object.freeze(blockers),
    ranAt,
  };
}

export function isOk<T extends object>(
  value: T | { error: string } | null | undefined
): value is T {
  if (value == null) return false;
  return !("error" in value);
}
