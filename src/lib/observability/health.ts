/**
 * RC-1 — application / dependency health checks (liveness, readiness, deep).
 */

import { getStaticPlatformServiceHealth } from "@/lib/platform/diagnostics/service-health";
import { resolveAppEnvironment } from "@/lib/platform/env/validate";
import { createAnonServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { observeDbOperation } from "./db-monitor";
import { metricsRegistry } from "./metrics";
import type { HealthCheckResult, HealthCheckStatus, HealthReport } from "./types";

function worst(statuses: HealthCheckStatus[]): HealthCheckStatus {
  if (statuses.includes("unavailable")) return "unavailable";
  if (statuses.includes("degraded")) return "degraded";
  return "healthy";
}

async function timeCheck(
  name: string,
  fn: () => Promise<{ status: HealthCheckStatus; detail: string }>
): Promise<HealthCheckResult> {
  const started =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  try {
    const result = await fn();
    const end =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    return {
      name,
      status: result.status,
      detail: result.detail,
      latencyMs: Math.round((end - started) * 100) / 100,
    };
  } catch (error) {
    const end =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    return {
      name,
      status: "unavailable",
      detail: error instanceof Error ? error.message : String(error),
      latencyMs: Math.round((end - started) * 100) / 100,
    };
  }
}

export function buildLivenessReport(): HealthReport {
  return {
    status: "healthy",
    probe: "liveness",
    checks: [
      {
        name: "application",
        status: "healthy",
        detail: "Process responding",
      },
    ],
    timestamp: new Date().toISOString(),
  };
}

export function buildReadinessEnvChecks(): HealthCheckResult[] {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (resolveAppEnvironment() === "production") {
    if (!process.env.NEXT_PUBLIC_APP_URL) missing.push("NEXT_PUBLIC_APP_URL");
    if (!process.env.CRON_SECRET) missing.push("CRON_SECRET");
    if (!process.env.VAULT_ENCRYPTION_KEY) missing.push("VAULT_ENCRYPTION_KEY");
    if (!process.env.RESEND_API_KEY) missing.push("RESEND_API_KEY");
  }

  return [
    {
      name: "environment",
      status: missing.length ? "unavailable" : "healthy",
      detail: missing.length ? `Missing: ${missing.join(", ")}` : "Required env present",
    },
  ];
}

export async function runDeepHealthChecks(): Promise<HealthReport> {
  const checks: HealthCheckResult[] = [...buildReadinessEnvChecks()];

  checks.push(
    await timeCheck("supabase_connectivity", async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        return { status: "unavailable", detail: "Supabase env missing" };
      }
      const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
        method: "GET",
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
      if (!response.ok) {
        return {
          status: "degraded",
          detail: `Auth health HTTP ${response.status}`,
        };
      }
      return { status: "healthy", detail: "Supabase Auth health ok" };
    })
  );

  checks.push(
    await timeCheck("database", async () => {
      try {
        const client = process.env.SUPABASE_SERVICE_ROLE_KEY
          ? createServiceRoleClient()
          : createAnonServerClient();
        const result = await observeDbOperation(
          "health.select_head",
          async () =>
            client
              .from("platform_activity_events")
              .select("id", { head: true, count: "exact" }),
          { table: "platform_activity_events" }
        );
        if (result.error) {
          return {
            status: "degraded",
            detail: `Query probe: ${result.error.message}`,
          };
        }
        return { status: "healthy", detail: "Database query probe ok" };
      } catch (error) {
        return {
          status: "unavailable",
          detail: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  const staticServices = getStaticPlatformServiceHealth();
  for (const svc of staticServices.slice(0, 6)) {
    checks.push({
      name: `integration:${svc.service}`,
      status: svc.status,
      detail: svc.detail,
    });
  }

  checks.push(
    await timeCheck("queue_workers", async () => {
      const hasCron = Boolean(process.env.CRON_SECRET);
      return {
        status:
          hasCron || resolveAppEnvironment() !== "production" ? "healthy" : "degraded",
        detail: hasCron
          ? "CRON_SECRET configured for queue processing routes"
          : "CRON_SECRET not set (ok outside production)",
      };
    })
  );

  checks.push(
    await timeCheck("cache", async () => {
      const redis = Boolean(
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      );
      const ratio = metricsRegistry.cacheRatio();
      return {
        status: "healthy",
        detail: redis
          ? `Upstash Redis configured; in-process hit ratio ${ratio.hitRatio}`
          : `In-process cache only; hit ratio ${ratio.hitRatio}`,
      };
    })
  );

  const status = worst(checks.map((c) => c.status));
  return {
    status,
    probe: "deep",
    checks,
    timestamp: new Date().toISOString(),
  };
}

export function httpStatusForHealth(status: HealthCheckStatus): number {
  if (status === "unavailable") return 503;
  return 200;
}
