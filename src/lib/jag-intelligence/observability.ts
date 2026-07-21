import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { StageMetric } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function recordStageMetric(
  supabase: AuthClient,
  input: {
    organizationId?: string | null;
    pipelineRunId: string;
    metric: StageMetric;
    modelLatencyMs?: number;
  }
): Promise<void> {
  try {
    await supabase.from("jag_pipeline_metrics").insert({
      organization_id: input.organizationId ?? null,
      pipeline_run_id: input.pipelineRunId,
      stage: input.metric.stage,
      duration_ms: input.metric.durationMs,
      queue_depth: input.metric.queueDepth ?? null,
      error_count: input.metric.errorCount,
      metadata: {
        modelLatencyMs: input.modelLatencyMs ?? null,
      },
    });
  } catch {
    // best-effort
  }
}

export function timeStage<T>(fn: () => T): { result: T; durationMs: number } {
  const start = Date.now();
  const result = fn();
  return { result, durationMs: Date.now() - start };
}

export async function timeStageAsync<T>(
  fn: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, durationMs: Date.now() - start };
}

export async function getPipelineObservability(
  supabase: AuthClient,
  pipelineRunId: string
) {
  const { data } = await supabase
    .from("jag_pipeline_metrics")
    .select("*")
    .eq("pipeline_run_id", pipelineRunId)
    .order("recorded_at");
  const rows = data ?? [];
  const totalMs = rows.reduce((a, r) => a + Number(r.duration_ms ?? 0), 0);
  const errors = rows.reduce((a, r) => a + Number(r.error_count ?? 0), 0);
  return {
    pipelineRunId,
    stages: rows,
    totalLatencyMs: totalMs,
    errorRate: rows.length ? errors / rows.length : 0,
    queueDepthMax: Math.max(0, ...rows.map((r) => Number(r.queue_depth ?? 0))),
  };
}
