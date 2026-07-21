import type { createAuthClient } from "@/lib/supabase/server-auth";
import { listPriorityIntegrationHealth } from "./integrations";
import { buildReleaseReport } from "@/lib/platform/release";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface ProductionObservabilitySnapshot {
  generatedAt: string;
  pipelineLatencyMs: number;
  workflowSuccessRate: number;
  queueDepth: number;
  integrationHealth: ReturnType<typeof listPriorityIntegrationHealth>;
  aiProviderLatencyMs: number;
  errorRate: number;
  releaseHealth: {
    ok: boolean;
    pass: number;
    warn: number;
    fail: number;
    overallScore: number;
  };
  metrics: Array<{ label: string; value: number; unit?: string; hint?: string }>;
}

export async function getProductionObservabilitySnapshot(
  supabase: AuthClient
): Promise<ProductionObservabilitySnapshot> {
  const { data: jagMetrics } = await supabase
    .from("jag_pipeline_metrics")
    .select("duration_ms, error_count, stage")
    .order("recorded_at", { ascending: false })
    .limit(100);

  const metricsRows = jagMetrics ?? [];
  const pipelineLatencyMs = metricsRows.length
    ? Math.round(
        metricsRows.reduce((a, r) => a + Number(r.duration_ms ?? 0), 0) /
          metricsRows.length
      )
    : 0;
  const errorRate = metricsRows.length
    ? metricsRows.filter((r) => Number(r.error_count ?? 0) > 0).length /
      metricsRows.length
    : 0;

  let queueDepth = 0;
  try {
    const { count } = await supabase
      .from("platform_queue_jobs")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "running"]);
    queueDepth = count ?? 0;
  } catch {
    queueDepth = 0;
  }

  let workflowSuccessRate = 1;
  try {
    const { data: wf } = await supabase
      .from("platform_workflow_instances")
      .select("status")
      .order("created_at", { ascending: false })
      .limit(50);
    const rows = wf ?? [];
    if (rows.length) {
      const ok = rows.filter(
        (r) => r.status === "completed" || r.status === "succeeded"
      ).length;
      workflowSuccessRate = ok / rows.length;
    }
  } catch {
    workflowSuccessRate = 1;
  }

  const release = buildReleaseReport();
  const pass = release.modules.filter((m) => m.overallVerdict === "pass").length;
  const warn = release.modules.filter((m) => m.overallVerdict === "warn").length;
  const fail = release.modules.filter((m) => m.overallVerdict === "fail").length;
  const overallScore = release.modules.length
    ? Math.round(
        release.modules.reduce((a, m) => a + m.overallScore, 0) /
          release.modules.length
      )
    : 0;

  const integrationHealth = listPriorityIntegrationHealth();
  const aiProviderLatencyMs = 0; // deferred providers report 0 until live

  return {
    generatedAt: new Date().toISOString(),
    pipelineLatencyMs,
    workflowSuccessRate,
    queueDepth,
    integrationHealth,
    aiProviderLatencyMs,
    errorRate,
    releaseHealth: {
      ok: release.ok,
      pass,
      warn,
      fail,
      overallScore,
    },
    metrics: [
      {
        label: "Pipeline latency",
        value: pipelineLatencyMs,
        unit: "ms",
        hint: "Avg JAG stage duration",
      },
      {
        label: "Workflow success",
        value: Math.round(workflowSuccessRate * 100),
        unit: "%",
      },
      { label: "Queue depth", value: queueDepth, hint: "Pending/running jobs" },
      {
        label: "Error rate",
        value: Math.round(errorRate * 100),
        unit: "%",
      },
      {
        label: "Integrations configured",
        value: integrationHealth.filter((i) => i.configured).length,
        hint: `${integrationHealth.length} registered`,
      },
      {
        label: "Release score",
        value: overallScore,
      },
    ],
  };
}
