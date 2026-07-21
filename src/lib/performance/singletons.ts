/**
 * Process-level singletons for ECC — Phase 1 + P005 cold-start elimination.
 * Same instances across requests; React cache() still dedupes within a request.
 * No behavior change: identical services, created once per process.
 */

import { createIntelligenceService } from "@/lib/platform/intelligence/create-service";
import {
  createIntegrationManagement,
  type IntegrationManagement,
} from "@/lib/platform/integrations";
import {
  getOrCreateRegisteredIntegrationPlatform,
  resetRegisteredIntegrationPlatformForTests,
} from "@/lib/platform/integrations/shared-platform";
import type { IntegrationScope } from "@/lib/platform/integrations/common/types";
import { measureAsync, measureSync, nowMs } from "./measure";

type IntelligenceService = ReturnType<typeof createIntelligenceService>;

let intelligenceSingleton: IntelligenceService | null = null;
let intelligenceInitMs: number | null = null;
let intelligenceInitCount = 0;

let integrationsSingleton: IntegrationManagement | null = null;
let integrationsInitMs: number | null = null;
let integrationsInitCount = 0;

/** ECC-critical connectors bootstrapped on first management init (parallel). */
const PHASE1_CONNECTORS = [
  "google",
  "microsoft",
  "quickbooks",
  "plaid",
  "hubspot",
  "bamboohr",
  "academyos",
  "square",
  "stripe",
  "csv",
] as const;

export function getIntelligenceSingletonStats() {
  return {
    initialized: intelligenceSingleton !== null,
    initMs: intelligenceInitMs,
    initCount: intelligenceInitCount,
  };
}

export function getIntegrationsSingletonStats() {
  return {
    initialized: integrationsSingleton !== null,
    initMs: integrationsInitMs,
    initCount: integrationsInitCount,
  };
}

/**
 * Process-wide intelligence DI container (ECC).
 * P005: lazy stack shell + prewarm of ECC hot stacks (oios / opportunity / wisdom).
 */
export function getOrCreateIntelligenceSingleton(): {
  service: IntelligenceService;
  coldStart: boolean;
  durationMs: number;
} {
  if (intelligenceSingleton) {
    return { service: intelligenceSingleton, coldStart: false, durationMs: 0 };
  }
  const { value, span } = measureSync("intelligence.createIntelligenceService", () => {
    const service = createIntelligenceService();
    // Materialise only ECC dashboard hot path — defer remaining ~30 modules.
    void service.oios;
    void service.opportunity;
    void service.wisdom;
    return service;
  });
  intelligenceSingleton = value;
  intelligenceInitMs = span.durationMs;
  intelligenceInitCount += 1;
  return { service: value, coldStart: true, durationMs: span.durationMs };
}

/**
 * Fresh instance for cold-path measurement only — does not replace singleton.
 * Uses eagerStacks so the probe still measures full-graph construction cost.
 */
export function createIntelligenceForBenchmark() {
  return measureSync("intelligence.createIntelligenceService.cold", () =>
    createIntelligenceService({ eagerStacks: true })
  );
}

export async function getOrCreateIntegrationsSingleton(): Promise<{
  management: IntegrationManagement;
  coldStart: boolean;
  durationMs: number;
}> {
  if (integrationsSingleton) {
    return { management: integrationsSingleton, coldStart: false, durationMs: 0 };
  }

  const started = nowMs();
  const { value: management, span: createSpan } = await measureAsync(
    "integrations.create+register",
    async () => {
      // P005: share registered platform with Organization Platform (no second catalog).
      const platform = getOrCreateRegisteredIntegrationPlatform();
      return createIntegrationManagement(platform);
    }
  );

  const scope: IntegrationScope = { organizationId: "exec-demo-org", schoolId: null };
  // Connectors are independent; bootstrap in parallel.
  const bootstrapResults = await Promise.all(
    PHASE1_CONNECTORS.map((connectorId) =>
      measureAsync(`integrations.bootstrap.${connectorId}`, () =>
        management.connections.bootstrap({ connectorId, scope, actor: "exec-seed" })
      )
    )
  );

  integrationsSingleton = management;
  integrationsInitMs = Math.round((nowMs() - started) * 100) / 100;
  integrationsInitCount += 1;

  void createSpan;
  void bootstrapResults;

  return {
    management,
    coldStart: true,
    durationMs: integrationsInitMs,
  };
}

/** Fresh platform for cold-path measurement only. */
export async function createIntegrationsForBenchmark() {
  return measureAsync("integrations.create+bootstrap.cold", async () => {
    // Intentional fresh platform (not the process shared instance) for cold delta.
    const { createIntegrationPlatform, registerAllConnectors } = await import(
      "@/lib/platform/integrations"
    );
    const platform = registerAllConnectors(createIntegrationPlatform());
    const management = createIntegrationManagement(platform);
    const scope: IntegrationScope = { organizationId: "exec-demo-org", schoolId: null };
    await Promise.all(
      PHASE1_CONNECTORS.map((connectorId) =>
        management.connections.bootstrap({ connectorId, scope, actor: "bench" })
      )
    );
    return management;
  });
}

/** Test helper — reset process singletons between vitest cases. */
export function resetPerformanceSingletonsForTests(): void {
  intelligenceSingleton = null;
  intelligenceInitMs = null;
  intelligenceInitCount = 0;
  integrationsSingleton = null;
  integrationsInitMs = null;
  integrationsInitCount = 0;
  resetRegisteredIntegrationPlatformForTests();
}
