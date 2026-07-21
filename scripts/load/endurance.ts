/**
 * RC-2 — endurance / soak test.
 * Default duration is short (env LOAD_ENDURANCE_MS); set to hours for RC soak.
 */

import { timedFetch, type AuthHeaders } from "./http";
import { LatencyCollector } from "./metrics";
import { analyzeEndurance, sampleResources } from "./resource";
import type { ResourceSample, ScenarioResult } from "./types";

export function enduranceDurationMs(): number {
  // Default 2 minutes for local/CI; staging RC can set 6h–24h.
  const raw = Number(process.env.LOAD_ENDURANCE_MS ?? String(2 * 60 * 1000));
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 2 * 60 * 1000;
}

export async function runEndurance(input: {
  baseUrl: string;
  paths: string[];
  concurrency: number;
  durationMs: number;
  auth?: AuthHeaders;
  onProgress?: (msg: string) => void;
}): Promise<{
  samples: ResourceSample[];
  summary: ScenarioResult;
  observations: string[];
}> {
  const collector = new LatencyCollector();
  const samples: ResourceSample[] = [];
  const endAt = Date.now() + input.durationMs;
  const sampleEvery = Math.max(5_000, Math.floor(input.durationMs / 12));

  samples.push(sampleResources());
  const sampler = setInterval(() => {
    samples.push(sampleResources());
  }, sampleEvery);

  const paths = input.paths.length ? input.paths : ["/api/health", "/api/ready", "/login"];
  const workers = Array.from({ length: Math.max(1, input.concurrency) }, async (_, i) => {
    let idx = i;
    while (Date.now() < endAt) {
      const path = paths[idx % paths.length]!;
      idx += 1;
      const url = new URL(path, input.baseUrl).toString();
      const hit = await timedFetch(url, { auth: input.auth, timeoutMs: 30_000 });
      collector.record(hit.durationMs, hit.status, hit.ok);
    }
  });

  input.onProgress?.(
    `Endurance ${input.durationMs}ms @ ${input.concurrency} VU across ${paths.length} paths`
  );
  await Promise.all(workers);
  clearInterval(sampler);
  samples.push(sampleResources());

  const snap = collector.snapshot(input.concurrency);
  return {
    samples,
    summary: {
      id: "endurance.soak",
      name: "Endurance soak",
      domain: "endurance",
      path: paths.join(","),
      ...snap,
    },
    observations: analyzeEndurance(samples),
  };
}
