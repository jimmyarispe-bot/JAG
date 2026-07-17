/**
 * ECC performance probe — measures loaders without changing their behavior.
 */

import { resolveExecutiveContextForIdentity } from "@/lib/platform/organization-platform";
import { createIntelligenceService } from "@/lib/platform/intelligence/create-service";
import { loadExecBrief } from "@/lib/exec/load-brief";
import { loadExecHealth } from "@/lib/exec/load-health";
import { loadExecHome } from "@/lib/exec/load-home";
import { loadExecOpportunities } from "@/lib/exec/load-opportunities";
import { loadExecRisks } from "@/lib/exec/load-risks";
import { loadExecWisdom } from "@/lib/exec/load-wisdom";
import { ensureAcademyOsSynced } from "@/lib/exec/ensure-academyos";
import { ensureSquareSynced } from "@/lib/exec/ensure-square";
import { buildDetections } from "./detections";
import { buildBundleReport, buildRouteInventory } from "./inventory";
import { commitTrace, measureAsync, nowMs } from "./measure";
import {
  createIntegrationsForBenchmark,
  getIntelligenceSingletonStats,
  getIntegrationsSingletonStats,
  getOrCreateIntelligenceSingleton,
  getOrCreateIntegrationsSingleton,
} from "./singletons";
import { performanceTraceStore } from "./store";
import type { PerfProbeReport, RouteTimingRow } from "./types";

async function timeRoute(
  route: string,
  label: string,
  loader: () => Promise<unknown>
): Promise<RouteTimingRow> {
  const spans = [];
  const intelStatsBefore = getIntelligenceSingletonStats();
  const intStatsBefore = getIntegrationsSingletonStats();

  const { span: intelSpan } = await measureAsync("intelligence.resolve", async () => {
    return getOrCreateIntelligenceSingleton();
  });
  spans.push(intelSpan);

  const { span: intSpan } = await measureAsync("integrations.resolve", async () => {
    return getOrCreateIntegrationsSingleton();
  });
  spans.push(intSpan);

  const { span: syncSpan } = await measureAsync("connectors.ensureSynced", async () => {
    await Promise.all([ensureAcademyOsSynced(), ensureSquareSynced()]);
  });
  spans.push(syncSpan);

  const { span: orgSpan } = await measureAsync("organization.resolve", async () => {
    return resolveExecutiveContextForIdentity({
      email: "perf.probe@jag.local",
      fullName: "Perf Probe",
    });
  });
  spans.push(orgSpan);

  const { span: buildSpan } = await measureAsync("loader.execute", loader);
  spans.push(buildSpan);

  const cacheHits =
    (intelStatsBefore.initialized ? 1 : 0) + (intStatsBefore.initialized ? 1 : 0);
  const cacheMisses =
    (intelStatsBefore.initialized ? 0 : 1) + (intStatsBefore.initialized ? 0 : 1);

  commitTrace({
    route,
    label,
    spans,
    cacheHits,
    cacheMisses,
    intelligenceColdStart: !intelStatsBefore.initialized,
    integrationsColdStart: !intStatsBefore.initialized,
  });

  return {
    route,
    label,
    totalMs: Math.round(spans.reduce((s, x) => s + x.durationMs, 0) * 100) / 100,
    intelligenceMs: intelSpan.durationMs,
    integrationsMs: intSpan.durationMs,
    syncMs: syncSpan.durationMs,
    buildMs: buildSpan.durationMs,
    orgResolutionMs: orgSpan.durationMs,
    cacheHits,
    cacheMisses,
  };
}

export async function runPerformanceProbe(): Promise<PerfProbeReport> {
  const processStart = nowMs();

  const coldIntelStart = nowMs();
  createIntelligenceService();
  const intelligenceColdMs = Math.round((nowMs() - coldIntelStart) * 100) / 100;

  getOrCreateIntelligenceSingleton();
  const warmIntelSecond = getOrCreateIntelligenceSingleton();

  const { span: coldIntSpan } = await createIntegrationsForBenchmark();
  await getOrCreateIntegrationsSingleton();
  const warmIntSecond = await getOrCreateIntegrationsSingleton();

  const routeTimings: RouteTimingRow[] = [];
  routeTimings.push(await timeRoute("/exec", "Home", () => loadExecHome()));
  routeTimings.push(await timeRoute("/exec/brief", "Brief", () => loadExecBrief()));
  routeTimings.push(await timeRoute("/exec/health", "Health", () => loadExecHealth()));
  routeTimings.push(
    await timeRoute("/exec/opportunities", "Opportunities", () => loadExecOpportunities())
  );
  routeTimings.push(
    await timeRoute("/exec/wisdom", "Wisdom", async () => loadExecWisdom())
  );
  routeTimings.push(
    await timeRoute("/exec/risks", "Risks", async () => loadExecRisks())
  );

  const inventory = buildRouteInventory();
  const partial = {
    generatedAt: new Date().toISOString(),
    processUptimeMs: Math.round(nowMs() - processStart),
    routeTimings,
    bundle: buildBundleReport(),
    routeInventory: {
      appRouteFiles: inventory.appRouteFiles,
      execRoutes: inventory.execRoutes,
      execClientComponents: inventory.execClientComponents,
      execServerComponents: inventory.execServerComponents,
    },
    singletons: {
      intelligenceInitialized: getIntelligenceSingletonStats().initialized,
      integrationsInitialized: getIntegrationsSingletonStats().initialized,
      intelligenceInitMs: getIntelligenceSingletonStats().initMs,
      integrationsInitMs: getIntegrationsSingletonStats().initMs,
    },
    comparisons: {
      intelligenceColdMs,
      intelligenceWarmMs: warmIntelSecond.durationMs,
      integrationsColdMs: coldIntSpan.durationMs,
      integrationsWarmMs: warmIntSecond.durationMs,
    },
  };

  const detections = buildDetections(partial);

  return {
    ...partial,
    detections,
  };
}

export function getRecentPerformanceSnapshot() {
  return {
    traces: performanceTraceStore.list(20),
    hydration: performanceTraceStore.listHydration(10),
    totals: performanceTraceStore.totals(),
  };
}
