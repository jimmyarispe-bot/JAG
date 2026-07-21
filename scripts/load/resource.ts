/**
 * RC-2 — process resource sampling (runner-side CPU/memory).
 * Server-side utilization should also be captured from Vercel/Supabase in staging.
 */

import type { ResourceSample } from "./types";

export function sampleResources(): ResourceSample {
  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();
  return {
    at: new Date().toISOString(),
    heapUsedMb: round(mem.heapUsed / 1024 / 1024),
    heapTotalMb: round(mem.heapTotal / 1024 / 1024),
    rssMb: round(mem.rss / 1024 / 1024),
    cpuUserMs: round(cpu.user / 1000),
    cpuSystemMs: round(cpu.system / 1000),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function analyzeEndurance(samples: ResourceSample[]): string[] {
  const observations: string[] = [];
  if (samples.length < 2) {
    observations.push("Insufficient samples for trend analysis");
    return observations;
  }
  const first = samples[0]!;
  const last = samples[samples.length - 1]!;
  const heapDelta = last.heapUsedMb - first.heapUsedMb;
  const rssDelta = last.rssMb - first.rssMb;
  observations.push(
    `Heap used Δ ${round(heapDelta)} MB (${first.heapUsedMb} → ${last.heapUsedMb})`
  );
  observations.push(`RSS Δ ${round(rssDelta)} MB (${first.rssMb} → ${last.rssMb})`);
  if (heapDelta > 100) {
    observations.push("WARNING: heap growth > 100MB during soak — investigate leaks");
  } else if (heapDelta > 30) {
    observations.push("NOTE: moderate heap growth; may be warm caches / buffers");
  } else {
    observations.push("Heap growth within expected warm-up band");
  }
  const cpuDelta =
    last.cpuUserMs + last.cpuSystemMs - (first.cpuUserMs + first.cpuSystemMs);
  observations.push(`CPU time accumulated on runner: ${round(cpuDelta)} ms`);
  return observations;
}
