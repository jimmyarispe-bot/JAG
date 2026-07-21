import type { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  InsightCategory,
  InsightStatus,
  PersistedInsight,
  PipelineResult,
} from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function mapRow(row: Record<string, unknown>): PersistedInsight {
  return {
    id: String(row.id),
    auditId: String(row.audit_id ?? ""),
    category: row.category as InsightCategory,
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    priority: Number(row.priority ?? 50),
    severity: String(row.severity ?? "info"),
    confidence: Number(row.confidence ?? 0.5),
    dataQuality: Number(row.data_quality ?? 0.5),
    evidenceCount: Number(row.evidence_count ?? 0),
    freshnessScore: Number(row.freshness_score ?? 0.5),
    explainabilityScore: Number(row.explainability_score ?? 0.5),
    explanation: String(row.explanation ?? ""),
    sourceEventIds: (row.source_event_ids as string[]) ?? [],
    relatedEntities:
      (row.related_entities as PersistedInsight["relatedEntities"]) ?? [],
    recommendation: (row.recommendation as string | null) ?? null,
    suggestedActions: (row.suggested_actions as string[]) ?? [],
    status: row.status as InsightStatus,
    resolution: (row.resolution as string | null) ?? null,
    pipelineRunId: (row.pipeline_run_id as string | null) ?? null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

/** Stage 10 — Insight Generation + persistence */
export async function persistPipelineInsights(
  supabase: AuthClient,
  input: {
    organizationId?: string | null;
    schoolId?: string | null;
    pipelineRunId: string;
    result: Pick<
      PipelineResult,
      "anomalies" | "recommendations" | "correlations" | "predictions"
    >;
  }
): Promise<PersistedInsight[]> {
  const rows: Record<string, unknown>[] = [];

  for (const a of input.result.anomalies.slice(0, 10)) {
    rows.push({
      organization_id: input.organizationId ?? null,
      school_id: input.schoolId ?? null,
      category: "anomaly",
      title: a.title,
      summary: a.summary,
      priority: Math.round(a.confidence * 100),
      severity: a.severity,
      confidence: a.confidence,
      data_quality: 0.7,
      evidence_count: a.evidence.length,
      freshness_score: 0.8,
      explainability_score: a.evidence.length ? 0.75 : 0.4,
      explanation: a.evidence.join("; "),
      source_event_ids: a.relatedEventIds,
      related_entities: a.relatedEntities,
      recommendation: null,
      suggested_actions: [],
      status: "open",
      pipeline_run_id: input.pipelineRunId,
    });
  }

  for (const r of input.result.recommendations.slice(0, 15)) {
    rows.push({
      organization_id: input.organizationId ?? null,
      school_id: input.schoolId ?? null,
      category: "recommendation",
      title: r.title,
      summary: r.summary,
      priority: r.priority,
      severity: r.priority >= 80 ? "high" : r.priority >= 60 ? "medium" : "info",
      confidence: r.confidence.confidence,
      data_quality: r.confidence.dataQuality,
      evidence_count: r.confidence.evidenceCount,
      freshness_score: r.confidence.freshness,
      explainability_score: r.confidence.explainability,
      explanation: r.explanation,
      source_event_ids: r.relatedEventIds,
      related_entities: [],
      recommendation: r.title,
      suggested_actions: r.suggestedActions,
      status: "open",
      pipeline_run_id: input.pipelineRunId,
    });
  }

  for (const c of input.result.correlations.slice(0, 8)) {
    rows.push({
      organization_id: input.organizationId ?? null,
      school_id: input.schoolId ?? null,
      category: "correlation",
      title: c.title,
      summary: c.summary,
      priority: Math.round(c.confidence * 70),
      severity: "info",
      confidence: c.confidence,
      data_quality: 0.65,
      evidence_count: c.evidence.length,
      freshness_score: 0.7,
      explainability_score: 0.7,
      explanation: c.evidence.join("; "),
      source_event_ids: [],
      related_entities: c.domains.map((d) => ({ type: "domain", id: d })),
      recommendation: null,
      suggested_actions: [],
      status: "open",
      pipeline_run_id: input.pipelineRunId,
    });
  }

  if (!rows.length) return [];

  const { data, error } = await supabase
    .from("jag_insights")
    .insert(rows)
    .select("*");

  if (error || !data) return [];
  return data.map((r) => mapRow(r as Record<string, unknown>));
}

export async function queryInsights(
  supabase: AuthClient,
  filters?: {
    organizationId?: string | null;
    category?: InsightCategory;
    status?: InsightStatus;
    limit?: number;
  }
): Promise<PersistedInsight[]> {
  let q = supabase
    .from("jag_insights")
    .select("*")
    .order("priority", { ascending: false })
    .limit(filters?.limit ?? 50);
  if (filters?.organizationId) q = q.eq("organization_id", filters.organizationId);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.status) q = q.eq("status", filters.status);
  const { data } = await q;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function searchInsights(
  supabase: AuthClient,
  query: string,
  organizationId?: string | null
): Promise<PersistedInsight[]> {
  const all = await queryInsights(supabase, {
    organizationId,
    limit: 100,
  });
  const q = query.toLowerCase();
  return all.filter(
    (i) =>
      i.title.toLowerCase().includes(q) ||
      i.summary.toLowerCase().includes(q) ||
      i.explanation.toLowerCase().includes(q)
  );
}

export async function resolveInsight(
  supabase: AuthClient,
  insightId: string,
  resolution: string,
  status: InsightStatus = "resolved"
): Promise<{ ok: true; insight: PersistedInsight } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from("jag_insights")
    .update({
      status,
      resolution,
      updated_at: new Date().toISOString(),
    })
    .eq("id", insightId)
    .select("*")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Resolve failed" };
  return { ok: true, insight: mapRow(data as Record<string, unknown>) };
}

export async function getInsightTimeline(
  supabase: AuthClient,
  organizationId?: string | null,
  limit = 40
): Promise<PersistedInsight[]> {
  let q = supabase
    .from("jag_insights")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (organizationId) q = q.eq("organization_id", organizationId);
  const { data } = await q;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}
