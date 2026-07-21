/**
 * RC-2 — concurrent load runner.
 */

import { timedFetch, type AuthHeaders } from "./http";
import { LatencyCollector } from "./metrics";
import type { ScenarioDef } from "./scenarios";
import type { ScenarioResult } from "./types";

export async function runScenario(input: {
  baseUrl: string;
  scenario: ScenarioDef;
  concurrency: number;
  durationMs: number;
  auth?: AuthHeaders;
}): Promise<ScenarioResult> {
  const collector = new LatencyCollector();
  const url = new URL(input.scenario.path, input.baseUrl).toString();
  const endAt = Date.now() + input.durationMs;
  const workers = Array.from({ length: Math.max(1, input.concurrency) }, () =>
    workerLoop(url, endAt, collector, input.auth)
  );
  await Promise.all(workers);
  const snap = collector.snapshot(input.concurrency);
  const notes: string[] = [];
  if (input.scenario.requiresAuth && !input.auth?.cookie && !input.auth?.authorization) {
    notes.push("Unauthenticated — measuring middleware/auth-gate latency");
  }

  return {
    id: input.scenario.id,
    name: input.scenario.name,
    domain: input.scenario.domain,
    path: input.scenario.path,
    ...snap,
    notes,
  };
}

async function workerLoop(
  url: string,
  endAt: number,
  collector: LatencyCollector,
  auth?: AuthHeaders
): Promise<void> {
  while (Date.now() < endAt) {
    const hit = await timedFetch(url, { auth, timeoutMs: 30_000 });
    collector.record(hit.durationMs, hit.status, hit.ok);
  }
}

export async function runScenarioSet(input: {
  baseUrl: string;
  scenarios: ScenarioDef[];
  concurrency: number;
  durationMs: number;
  auth?: AuthHeaders;
  onProgress?: (msg: string) => void;
}): Promise<ScenarioResult[]> {
  const results: ScenarioResult[] = [];
  for (const scenario of input.scenarios) {
    input.onProgress?.(
      `Scenario ${scenario.id} @ ${input.concurrency} VU for ${input.durationMs}ms`
    );
    results.push(
      await runScenario({
        baseUrl: input.baseUrl,
        scenario,
        concurrency: input.concurrency,
        durationMs: input.durationMs,
        auth: input.auth,
      })
    );
  }
  return results;
}
