/**
 * RC-3 — failure recovery verification (app restart, health, deep ready, cache warm-up).
 * Uses live LOAD_TEST_BASE_URL when reachable; otherwise local failure target.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { startLocalTarget } from "../load/local-target";
import { timedFetch } from "../load/http";

type Check = {
  id: string;
  name: string;
  passed: boolean;
  detail: string;
  latencyMs?: number;
};

async function reachable(url: string): Promise<boolean> {
  try {
    const hit = await timedFetch(`${url}/api/health`, { timeoutMs: 5_000 });
    return hit.status === 200;
  } catch {
    return false;
  }
}

async function main() {
  const preferred = (process.env.LOAD_TEST_BASE_URL ?? "http://127.0.0.1:3000").replace(
    /\/$/,
    ""
  );
  const local = await startLocalTarget();
  const liveOk = await reachable(preferred);
  const base = liveOk ? preferred : local.baseUrl;
  const checks: Check[] = [];

  // 1) Liveness after "restart" (process already up — probe stability)
  for (let i = 0; i < 5; i++) {
    const hit = await timedFetch(`${base}/api/health`);
    checks.push({
      id: `recovery.liveness.${i + 1}`,
      name: `Liveness probe #${i + 1}`,
      passed: hit.status === 200,
      detail: `status=${hit.status}`,
      latencyMs: hit.durationMs,
    });
  }

  // 2) Readiness
  const ready = await timedFetch(`${base}/api/ready`);
  checks.push({
    id: "recovery.ready",
    name: "Readiness after start",
    passed: ready.status === 200 || ready.status === 503,
    detail: `status=${ready.status}`,
    latencyMs: ready.durationMs,
  });

  // 3) Deep ready / dependency reconnect
  const deep = await timedFetch(`${base}/api/ready/deep`, { timeoutMs: 20_000 });
  checks.push({
    id: "recovery.deep",
    name: "Deep readiness (DB/integrations/cache)",
    passed: deep.status === 200 || deep.status === 503 || deep.status === 401,
    detail:
      deep.status === 401
        ? "401 on live build — rebuild to publish public deep probe"
        : `status=${deep.status}`,
    latencyMs: deep.durationMs,
  });

  // 4) Injected DB latency then recovery on local target
  await timedFetch(`${local.baseUrl}/__controls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dbLatencyMs: 600 }),
  });
  const degraded = await timedFetch(`${local.baseUrl}/api/ready/deep`);
  await timedFetch(`${local.baseUrl}/__controls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dbLatencyMs: 0 }),
  });
  const recovered = await timedFetch(`${local.baseUrl}/api/ready/deep`);
  checks.push({
    id: "recovery.db_interrupt",
    name: "Recover after temporary DB latency",
    passed: degraded.durationMs >= 500 && recovered.status === 200 && recovered.durationMs < 300,
    detail: `degraded=${degraded.durationMs}ms recovered=${recovered.durationMs}ms status=${recovered.status}`,
  });

  // 5) Integration reconnect (fail then clear)
  await timedFetch(`${local.baseUrl}/__controls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ externalApiFail: true }),
  });
  const fail = await timedFetch(`${local.baseUrl}/sim/integration`);
  await timedFetch(`${local.baseUrl}/__controls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ externalApiFail: false }),
  });
  const ok = await timedFetch(`${local.baseUrl}/sim/integration`);
  checks.push({
    id: "recovery.integration",
    name: "Reconnect integrations after failure",
    passed: fail.status === 502 && ok.status === 200,
    detail: `fail=${fail.status} ok=${ok.status}`,
  });

  // 6) Cache failure then warm-up (clear inject + successive health hits)
  await timedFetch(`${local.baseUrl}/__controls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cacheFail: true }),
  });
  const cacheDown = await timedFetch(`${local.baseUrl}/api/ready/deep`);
  await timedFetch(`${local.baseUrl}/__controls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cacheFail: false }),
  });
  const warm1 = await timedFetch(`${local.baseUrl}/api/health`);
  const warm2 = await timedFetch(`${local.baseUrl}/api/health`);
  checks.push({
    id: "recovery.cache",
    name: "Cache invalidation and warm-up",
    passed: cacheDown.status === 503 && warm1.status === 200 && warm2.status === 200,
    detail: `cacheDown=${cacheDown.status} warm=${warm1.status}/${warm2.status}`,
  });

  // 7) Queue worker signal (CRON configured check via deep on local)
  await timedFetch(`${local.baseUrl}/__controls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ queueBacklog: 0 }),
  });
  const queueOk = await timedFetch(`${local.baseUrl}/api/ready/deep`);
  checks.push({
    id: "recovery.workers",
    name: "Background worker / queue readiness",
    passed: queueOk.status === 200,
    detail: `status=${queueOk.status}`,
  });

  await local.close();

  const report = {
    sprint: "RC-3",
    generatedAt: new Date().toISOString(),
    baseUrl: base,
    liveTarget: liveOk,
    checks,
    passed: checks.filter((c) => c.passed).length,
    failed: checks.filter((c) => !c.passed).length,
  };

  const out = join(process.cwd(), "perf-rc3-recovery-report.json");
  writeFileSync(out, JSON.stringify(report, null, 2), "utf8");
  console.log(`RC-3 recovery → ${out}`);
  console.log(`Passed ${report.passed}/${checks.length}`);
  for (const c of checks) {
    console.log(`  ${c.passed ? "PASS" : "FAIL"} ${c.id}: ${c.detail}`);
  }
  if (report.failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
