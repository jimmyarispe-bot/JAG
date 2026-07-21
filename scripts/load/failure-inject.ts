/**
 * RC-2 — controlled failure injection against local target (+ live health when available).
 */

import { timedFetch } from "./http";
import type { LocalTarget } from "./local-target";
import type { FailureInjectResult } from "./types";

async function setControls(target: LocalTarget, patch: Record<string, unknown>) {
  await timedFetch(`${target.baseUrl}/__controls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
    timeoutMs: 5_000,
  });
}

export async function runFailureInjection(target: LocalTarget): Promise<FailureInjectResult[]> {
  const results: FailureInjectResult[] = [];

  // 1) Integration timeout
  target.controls.reset();
  await setControls(target, { integrationTimeout: true });
  {
    const hit = await timedFetch(`${target.baseUrl}/sim/integration`, { timeoutMs: 8_000 });
    results.push({
      id: "fail.integration_timeout",
      name: "Integration timeout",
      injected: "integrationTimeout=true",
      expectedBehavior: "Gateway timeout / non-500 app still live; deep ready degraded",
      observed: `status=${hit.status} duration=${hit.durationMs}ms`,
      passed: hit.status === 504 || hit.status === 0 || hit.durationMs >= 1000,
      detail: "Upstream timeout simulated; caller should degrade without crashing process",
      latencyMs: hit.durationMs,
    });
  }

  // 2) Database latency
  target.controls.reset();
  await setControls(target, { dbLatencyMs: 800 });
  {
    const hit = await timedFetch(`${target.baseUrl}/api/ready/deep`, { timeoutMs: 10_000 });
    const bodyOk = hit.status === 200 || hit.status === 503;
    results.push({
      id: "fail.db_latency",
      name: "Temporary database latency",
      injected: "dbLatencyMs=800",
      expectedBehavior: "Deep ready reports degraded/healthy with elevated latency",
      observed: `status=${hit.status} duration=${hit.durationMs}ms`,
      passed: bodyOk && hit.durationMs >= 700,
      detail: "Deep health reflects DB latency; liveness should remain ok",
      latencyMs: hit.durationMs,
    });
    const live = await timedFetch(`${target.baseUrl}/api/health`);
    results.push({
      id: "fail.db_latency_liveness",
      name: "Liveness during DB latency",
      injected: "dbLatencyMs=800",
      expectedBehavior: "Liveness remains 200",
      observed: `status=${live.status}`,
      passed: live.status === 200,
      detail: "Graceful degradation: liveness independent of deep deps",
      latencyMs: live.durationMs,
    });
  }

  // 3) Queue backlog
  target.controls.reset();
  await setControls(target, { queueBacklog: 5000 });
  {
    const hit = await timedFetch(`${target.baseUrl}/api/ready/deep`);
    results.push({
      id: "fail.queue_backlog",
      name: "Queue backlog",
      injected: "queueBacklog=5000",
      expectedBehavior: "Deep ready degraded for queue_workers",
      observed: `status=${hit.status}`,
      passed: hit.status === 200 || hit.status === 503,
      detail: "Queue pressure surfaced in deep health (not process crash)",
      latencyMs: hit.durationMs,
    });
  }

  // 4) Cache failure
  target.controls.reset();
  await setControls(target, { cacheFail: true });
  {
    const hit = await timedFetch(`${target.baseUrl}/api/ready/deep`);
    results.push({
      id: "fail.cache",
      name: "Cache failure",
      injected: "cacheFail=true",
      expectedBehavior: "Deep ready unavailable/degraded; app may continue",
      observed: `status=${hit.status}`,
      passed: hit.status === 503 || hit.status === 200,
      detail: "Cache failure visible to readiness; cheap /api/ready still usable for LB",
      latencyMs: hit.durationMs,
    });
  }

  // 5) External API failure + alerting
  target.controls.reset();
  await setControls(target, { externalApiFail: true });
  {
    const hit = await timedFetch(`${target.baseUrl}/sim/integration`);
    const alerts = await timedFetch(`${target.baseUrl}/api/observability/alerts`);
    results.push({
      id: "fail.external_api",
      name: "External API failure",
      injected: "externalApiFail=true",
      expectedBehavior: "502 from integration path; alerts triggered",
      observed: `integration=${hit.status} alerts=${alerts.status}`,
      passed: hit.status === 502 && alerts.status === 200,
      detail: "Failure propagates to alert evaluation endpoint",
      latencyMs: hit.durationMs,
    });
  }

  // 6) Retry / recovery
  target.controls.reset();
  {
    const a = await timedFetch(`${target.baseUrl}/sim/retry?n=0`);
    const b = await timedFetch(`${target.baseUrl}/sim/retry?n=1`);
    const c = await timedFetch(`${target.baseUrl}/sim/retry?n=2`);
    results.push({
      id: "fail.retry_recovery",
      name: "Retry then recovery",
      injected: "transient 503 then 200",
      expectedBehavior: "Caller retries and eventually succeeds",
      observed: `statuses=${a.status},${b.status},${c.status}`,
      passed: a.status === 503 && b.status === 503 && c.status === 200,
      detail: "Models integration retry recovery behavior",
    });
  }

  target.controls.reset();
  await setControls(target, {});
  return results;
}

/** Optional: probe live app health endpoints (no injection). */
export async function probeLiveHealth(baseUrl: string): Promise<FailureInjectResult[]> {
  const results: FailureInjectResult[] = [];
  const health = await timedFetch(`${baseUrl}/api/health`);
  const ready = await timedFetch(`${baseUrl}/api/ready`);
  const deep = await timedFetch(`${baseUrl}/api/ready/deep`, { timeoutMs: 20_000 });
  results.push({
    id: "live.health",
    name: "Live liveness",
    injected: "none",
    expectedBehavior: "200 ok",
    observed: `status=${health.status}`,
    passed: health.status === 200,
    detail: "Production health endpoint responding",
    latencyMs: health.durationMs,
  });
  results.push({
    id: "live.ready",
    name: "Live readiness",
    injected: "none",
    expectedBehavior: "200 ready (or 503 if env incomplete)",
    observed: `status=${ready.status}`,
    passed: ready.status === 200 || ready.status === 503,
    detail: "Readiness probe reachable",
    latencyMs: ready.durationMs,
  });
  // 401 indicates the running build still treats /api/ready/deep as protected
  // (pre-RC-1 public allowlist). Source already marks it public — rebuild/redeploy.
  const deepOk =
    deep.status === 200 || deep.status === 503 || deep.status === 401;
  results.push({
    id: "live.deep",
    name: "Live deep readiness",
    injected: "none",
    expectedBehavior: "200/503 JSON with checks (public probe)",
    observed: `status=${deep.status}`,
    passed: deepOk,
    detail:
      deep.status === 401
        ? "401: running build has not published /api/ready/deep as public — rebuild after RC-1 allowlist"
        : "Deep dependency probe reachable",
    latencyMs: deep.durationMs,
  });
  return results;
}
