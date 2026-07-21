import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../helpers/mock-supabase";

vi.mock("@/lib/platform/shared/context", () => ({
  resolveActorUserId: vi.fn(async () => TEST_UUIDS.user),
  resolveSchoolContext: vi.fn(async () => ({
    organizationId: TEST_UUIDS.organization,
    schoolId: TEST_UUIDS.school,
  })),
}));

vi.mock("@/lib/platform/activity", () => ({
  recordActivity: vi.fn(async () => ({ id: TEST_UUIDS.activity })),
}));

import { stageNormalization } from "@/lib/jag-intelligence/stages/normalize";
import { stageContextEnrichment } from "@/lib/jag-intelligence/stages/context";
import { stageCrossDomainCorrelation } from "@/lib/jag-intelligence/stages/correlate";
import { stagePatternDetection } from "@/lib/jag-intelligence/stages/patterns";
import { stageAnomalyDetection } from "@/lib/jag-intelligence/stages/anomaly";
import { stagePrediction } from "@/lib/jag-intelligence/stages/predict";
import { stageRecommendationWithConfidence } from "@/lib/jag-intelligence/stages/recommend";
import {
  scoreConfidence,
  scoreDataQuality,
  scoreFreshness,
} from "@/lib/jag-intelligence/confidence";
import { buildKnowledgeGraph, traverseNeighbors } from "@/lib/jag-intelligence/graph";
import {
  ensureModelProvidersRegistered,
  getModelProvider,
  listModelProviders,
  invokeModelReasoning,
} from "@/lib/jag-intelligence/providers";
import { recordDecisionFeedback } from "@/lib/jag-intelligence/feedback";
import { getLearningSummary } from "@/lib/jag-intelligence/learning";
import { runJagIntelligencePipeline, listPipelineStages } from "@/lib/jag-intelligence/pipeline";
import { PIPELINE_STAGES } from "@/lib/jag-intelligence/types";
import { ACTIVITY_EVENT_CATALOG } from "@/lib/platform/activity/catalog";
import { WORKFLOW_TRIGGER_LIBRARY } from "@/lib/workflows/triggers";
import type { EiEventSignal } from "@/lib/founder-intelligence/events";

function signal(
  partial: Partial<EiEventSignal> & Pick<EiEventSignal, "eventType" | "moduleKey">
): EiEventSignal {
  return {
    id: partial.id ?? `evt-${Math.random().toString(36).slice(2, 8)}`,
    eventType: partial.eventType,
    moduleKey: partial.moduleKey,
    title: partial.title ?? partial.eventType,
    summary: partial.summary ?? "summary",
    occurredAt: partial.occurredAt ?? new Date().toISOString(),
    entityType: partial.entityType ?? "student",
    entityId: partial.entityId ?? TEST_UUIDS.student,
    classification: partial.classification ?? null,
    payload: null,
  };
}

const SIGNALS: EiEventSignal[] = [
  signal({ eventType: "invoice.overdue", moduleKey: "finance", entityType: "invoice" }),
  signal({ eventType: "payment.failed", moduleKey: "finance" }),
  signal({ eventType: "workflow.failed", moduleKey: "workflows" }),
  signal({ eventType: "workflow.failed", moduleKey: "workflows" }),
  signal({ eventType: "employee.certification.expiring", moduleKey: "hr" }),
  signal({ eventType: "employee.terminated", moduleKey: "hr", entityType: "employee" }),
  signal({ eventType: "employee.terminated", moduleKey: "hr", entityType: "employee" }),
  signal({ eventType: "employee.hired", moduleKey: "hr" }),
  signal({ eventType: "lead.created", moduleKey: "admissions" }),
  signal({ eventType: "lead.created", moduleKey: "admissions" }),
  signal({ eventType: "lead.created", moduleKey: "admissions" }),
  signal({ eventType: "student.archived", moduleKey: "sis" }),
  signal({ eventType: "student.archived", moduleKey: "sis" }),
  signal({ eventType: "attendance.threshold_reached", moduleKey: "sis" }),
  signal({ eventType: "attendance.threshold_reached", moduleKey: "sis" }),
  signal({ eventType: "attendance.threshold_reached", moduleKey: "sis" }),
  signal({ eventType: "payment.received", moduleKey: "finance" }),
  signal({ eventType: "document.created", moduleKey: "documents" }),
];

describe("pipeline stages (independent)", () => {
  it("lists all required stages", () => {
    expect(listPipelineStages()).toEqual(PIPELINE_STAGES);
    expect(PIPELINE_STAGES).toContain("event_ingestion");
    expect(PIPELINE_STAGES).toContain("insight_generation");
  });

  it("normalizes ingested events", () => {
    const events = stageNormalization(SIGNALS);
    expect(events.length).toBe(SIGNALS.length);
    expect(events[0].domain).toBeTruthy();
    expect(events[0].severityRank).toBeGreaterThan(0);
  });

  it("builds organizational context", () => {
    const ctx = stageContextEnrichment(SIGNALS);
    expect(ctx.financialHealthScore).toBeGreaterThanOrEqual(0);
    expect(ctx.factors.length).toBeGreaterThan(0);
    expect(ctx.domains).toBeTruthy();
  });

  it("correlates and detects patterns/anomalies", () => {
    const events = stageNormalization(SIGNALS);
    const corr = stageCrossDomainCorrelation(SIGNALS);
    expect(corr.length).toBeGreaterThan(0);
    const patterns = stagePatternDetection(events);
    expect(patterns.length).toBeGreaterThan(0);
    const anomalies = stageAnomalyDetection(events);
    expect(anomalies.some((a) => a.id.includes("overdue") || a.id.includes("staffing"))).toBe(
      true
    );
    expect(anomalies[0].evidence.length).toBeGreaterThan(0);
    expect(anomalies[0].confidence).toBeGreaterThan(0);
  });

  it("predicts and recommends with confidence breakdown", () => {
    const events = stageNormalization(SIGNALS);
    const preds = stagePrediction(SIGNALS);
    expect(preds.some((p) => p.id === "pred-enrollment")).toBe(true);
    const recs = stageRecommendationWithConfidence(SIGNALS, events);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].confidence.confidence).toBeGreaterThan(0);
    expect(recs[0].confidence.dataQuality).toBeGreaterThan(0);
    expect(recs[0].confidence.freshness).toBeGreaterThan(0);
    expect(recs[0].confidence.explainability).toBeGreaterThan(0);
  });
});

describe("confidence engine", () => {
  it("scores freshness, data quality, and composite confidence", () => {
    const events = stageNormalization(SIGNALS);
    expect(scoreFreshness(new Date().toISOString())).toBeGreaterThan(0.8);
    expect(scoreDataQuality(events)).toBeGreaterThan(0.4);
    const c = scoreConfidence({
      events,
      evidenceCount: 4,
      baseConfidence: 0.7,
      explanation: "Because overdue invoices spiked in the window.",
      factorCount: 3,
    });
    expect(c.evidenceCount).toBe(4);
    expect(c.confidence).toBeGreaterThan(0.5);
  });
});

describe("knowledge graph", () => {
  it("builds traversable explainable edges", () => {
    const events = stageNormalization(SIGNALS);
    const graph = buildKnowledgeGraph(events);
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.edges[0].explainability).toBeTruthy();
    const key = `${graph.nodes[0].type}:${graph.nodes[0].id}`;
    const neigh = traverseNeighbors(graph, key, 1);
    expect(neigh.pathExplain.length).toBeGreaterThanOrEqual(0);
  });
});

describe("provider abstraction", () => {
  it("registers deferred OpenAI/Anthropic/Google/Local adapters", async () => {
    ensureModelProvidersRegistered();
    const ids = listModelProviders().map((p) => p.id);
    expect(ids).toContain("openai");
    expect(ids).toContain("anthropic");
    expect(ids).toContain("google");
    expect(ids).toContain("local");
    expect(getModelProvider("openai").isConfigured()).toBe(false);
    const result = await invokeModelReasoning({ prompt: "test" });
    expect(result.deferred).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

describe("decision feedback + learning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records feedback and learning outcomes without auto-retrain", async () => {
    const supabase = createMockSupabase((ctx) => {
      if (ctx.table === "jag_decision_feedback") {
        return { data: { id: "fb-1" }, error: null };
      }
      if (ctx.table === "jag_learning_records") {
        return {
          data: [
            { accepted: true, ignored: false },
            { accepted: false, ignored: true },
          ],
          error: null,
        };
      }
      if (ctx.table === "jag_insights") {
        return { data: { id: "ins-1" }, error: null };
      }
      return { data: { id: "x" }, error: null };
    });

    const fb = await recordDecisionFeedback(supabase, {
      organizationId: TEST_UUIDS.organization,
      insightId: "ins-1",
      outcome: "accepted",
      actualImpact: "Collections improved",
    });
    expect(fb.ok).toBe(true);

    const summary = await getLearningSummary(supabase, TEST_UUIDS.organization);
    expect(summary.retrainEnabled).toBe(false);
    expect(summary.total).toBeGreaterThan(0);
  });
});

describe("full pipeline + persistence", () => {
  it("runs pipeline end-to-end and persists insights", async () => {
    const supabase = createMockSupabase((ctx) => {
      if (ctx.table === "platform_activity_events") {
        return {
          data: SIGNALS.map((s) => ({
            id: s.id,
            event_type: s.eventType,
            module_key: s.moduleKey,
            title: s.title,
            summary: s.summary,
            occurred_at: s.occurredAt,
            entity_type: s.entityType,
            entity_id: s.entityId,
            classification: s.classification,
            payload: null,
          })),
          error: null,
        };
      }
      if (ctx.table === "jag_insights") {
        return {
          data: [
            {
              id: "insight-1",
              audit_id: "a1",
              category: "recommendation",
              title: "Test insight",
              summary: "Summary",
              priority: 80,
              severity: "high",
              confidence: 0.8,
              data_quality: 0.7,
              evidence_count: 2,
              freshness_score: 0.9,
              explainability_score: 0.8,
              explanation: "why",
              source_event_ids: [],
              related_entities: [],
              recommendation: "Act",
              suggested_actions: ["Do"],
              status: "open",
              resolution: null,
              pipeline_run_id: "run-1",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          error: null,
        };
      }
      return { data: { id: "ok" }, error: null };
    });

    const result = await runJagIntelligencePipeline(supabase, {
      organizationId: TEST_UUIDS.organization,
      schoolId: TEST_UUIDS.school,
      persistInsights: true,
      persistGraph: true,
    });

    expect(result.pipelineRunId).toBeTruthy();
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.context.openRiskCount).toBeGreaterThanOrEqual(0);
    expect(result.anomalies.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.metrics.length).toBeGreaterThanOrEqual(PIPELINE_STAGES.length - 1);
    expect(result.founderAnalysis.risks.length).toBeGreaterThan(0);
    expect(result.insights.length).toBeGreaterThan(0);
  });
});

describe("EI + workflow wiring", () => {
  it("registers jag EI events and workflow triggers", () => {
    for (const key of [
      "jag.pipeline.completed",
      "jag.insight.created",
      "jag.insight.resolved",
      "jag.anomaly.detected",
      "jag.feedback.recorded",
      "jag.context.updated",
    ]) {
      expect(ACTIVITY_EVENT_CATALOG[key]).toBeTruthy();
    }
    const events = new Set(
      WORKFLOW_TRIGGER_LIBRARY.flatMap((t) => t.activityEventTypes ?? [])
    );
    expect(events.has("jag.pipeline.completed")).toBe(true);
    expect(events.has("jag.anomaly.detected")).toBe(true);
  });
});
