/**
 * RC-2 — database capacity snapshot via deep ready + observability metrics.
 */

import { timedFetch } from "./http";
import type { DbCapacitySnapshot } from "./types";

export async function captureDbCapacity(input: {
  liveBaseUrl?: string;
  cronSecret?: string;
}): Promise<DbCapacitySnapshot> {
  const at = new Date().toISOString();

  if (!input.liveBaseUrl) {
    return {
      at,
      source: "unavailable",
      poolNote:
        "No live base URL — DB pool/locks must be observed in Supabase during staging load.",
    };
  }

  const deep = await timedFetch(`${input.liveBaseUrl}/api/ready/deep`, {
    timeoutMs: 20_000,
  });

  let checks: DbCapacitySnapshot["checks"];
  let deepReadyStatus: string | undefined;
  try {
    // Re-fetch JSON body (timedFetch drains) — do a second fetch for content.
    const res = await fetch(`${input.liveBaseUrl}/api/ready/deep`, {
      headers: { Accept: "application/json" },
    });
    const json = (await res.json()) as {
      status?: string;
      checks?: Array<{ name: string; status: string; latencyMs?: number; detail: string }>;
    };
    deepReadyStatus = json.status ?? String(deep.status);
    checks = json.checks;
  } catch {
    deepReadyStatus = String(deep.status);
  }

  let metricsDbP95: number | undefined;
  let slowQueryCount: number | undefined;
  let poolNote =
    "Connection pool utilization and lock contention: use Supabase dashboard during load.";

  if (input.cronSecret) {
    try {
      const res = await fetch(`${input.liveBaseUrl}/api/observability/metrics`, {
        headers: { Authorization: `Bearer ${input.cronSecret}` },
      });
      if (res.ok) {
        const json = (await res.json()) as {
          dashboard?: {
            latency?: { database?: { p95?: number } };
            slowestQueries?: unknown[];
            database?: { note?: string; recentSlowCount?: number };
          };
        };
        metricsDbP95 = json.dashboard?.latency?.database?.p95;
        slowQueryCount = json.dashboard?.database?.recentSlowCount;
        if (json.dashboard?.database?.note) poolNote = json.dashboard.database.note;
      }
    } catch {
      // optional
    }
  }

  return {
    at,
    deepReadyStatus,
    checks,
    metricsDbP95,
    slowQueryCount,
    poolNote,
    source: "live",
  };
}
