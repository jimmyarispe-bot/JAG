/**
 * Persistence for Listening Intelligence (analysis_runs, signals, evidence_links).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapSignalClassToDbType,
  type ListeningAnalysisRunResult,
  type ListeningCampaignMetrics,
  type ListeningEvidenceRow,
  type ListeningExtractedSignal,
  type ListeningSignalClass,
  type ListeningSignalRow,
} from "./types";
import type { ListeningAnalysisPlan } from "./pipeline";

type Db = SupabaseClient;

function requireOrg(organizationId: string): string {
  const id = organizationId?.trim();
  if (!id) throw new Error("listening_organization_required");
  return id;
}

function asClass(raw: unknown): ListeningSignalClass {
  const v = String(raw ?? "unknown");
  const allowed = [
    "theme",
    "strength",
    "concern",
    "opportunity",
    "risk",
    "question",
    "suggestion",
    "unknown",
  ];
  return (allowed.includes(v) ? v : "unknown") as ListeningSignalClass;
}

export async function persistListeningAnalysisRun(
  db: Db,
  input: {
    organizationId: string;
    campaignId: string;
    instrumentId: string | null;
    instrumentVersionId: string | null;
    createdBy?: string | null;
    plan: ListeningAnalysisPlan;
  }
): Promise<ListeningAnalysisRunResult> {
  const organizationId = requireOrg(input.organizationId);
  const startedAt = new Date().toISOString();

  const { data: run, error: runErr } = await db
    .from("listening_analysis_runs")
    .insert({
      organization_id: organizationId,
      campaign_id: input.campaignId,
      run_kind: "deterministic",
      status: "running",
      started_at: startedAt,
      created_by: input.createdBy ?? null,
      metadata: {
        engine: input.plan.engine,
        grouper_id: input.plan.grouperId,
        instrument_id: input.instrumentId,
        instrument_version_id: input.instrumentVersionId,
      },
    })
    .select("id")
    .single();
  if (runErr) throw runErr;
  const analysisRunId = String(run.id);

  try {
    let evidenceCount = 0;
    for (const signal of input.plan.signals) {
      const n = await insertSignalWithEvidence(db, {
        organizationId,
        campaignId: input.campaignId,
        analysisRunId,
        instrumentId: input.instrumentId,
        instrumentVersionId: input.instrumentVersionId,
        signal,
      });
      evidenceCount += n;
    }

    const completedAt = new Date().toISOString();
    const { error: doneErr } = await db
      .from("listening_analysis_runs")
      .update({
        status: "succeeded",
        completed_at: completedAt,
        metadata: {
          engine: input.plan.engine,
          grouper_id: input.plan.grouperId,
          instrument_id: input.instrumentId,
          instrument_version_id: input.instrumentVersionId,
          metrics: input.plan.metrics,
          signal_count: input.plan.signals.length,
          evidence_count: evidenceCount,
        },
      })
      .eq("organization_id", organizationId)
      .eq("id", analysisRunId);
    if (doneErr) throw doneErr;

    return {
      analysisRunId,
      organizationId,
      campaignId: input.campaignId,
      status: "succeeded",
      signalCount: input.plan.signals.length,
      evidenceCount,
      metrics: input.plan.metrics,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "listening_analysis_failed";
    await db
      .from("listening_analysis_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_summary: message.slice(0, 500),
      })
      .eq("organization_id", organizationId)
      .eq("id", analysisRunId);
    return {
      analysisRunId,
      organizationId,
      campaignId: input.campaignId,
      status: "failed",
      signalCount: 0,
      evidenceCount: 0,
      metrics: input.plan.metrics,
      errorSummary: message,
    };
  }
}

async function insertSignalWithEvidence(
  db: Db,
  input: {
    organizationId: string;
    campaignId: string;
    analysisRunId: string;
    instrumentId: string | null;
    instrumentVersionId: string | null;
    signal: ListeningExtractedSignal;
  }
): Promise<number> {
  if (input.signal.evidence.length === 0) {
    throw new Error("listening_signal_requires_evidence");
  }

  const { data: signal, error } = await db
    .from("listening_signals")
    .insert({
      organization_id: input.organizationId,
      campaign_id: input.campaignId,
      analysis_run_id: input.analysisRunId,
      signal_kind: "deterministic",
      signal_type: mapSignalClassToDbType(input.signal.signalClass),
      title: input.signal.title,
      summary: input.signal.description,
      status: "proposed",
      confidence: input.signal.confidence,
      metadata: {
        listening_class: input.signal.signalClass,
        support_count: input.signal.supportCount,
        question_id: input.signal.questionId,
        instrument_id: input.instrumentId,
        instrument_version_id: input.instrumentVersionId,
      },
    })
    .select("id")
    .single();
  if (error) throw error;

  const rows = input.signal.evidence.map((ev) => ({
    organization_id: input.organizationId,
    signal_id: signal.id,
    evidence_kind: ev.evidenceKind,
    answer_id: ev.answerId ?? null,
    question_id: ev.questionId ?? null,
    response_id: ev.responseId ?? null,
    label: ev.label,
    payload: ev.payload,
  }));

  const { error: evErr } = await db
    .from("listening_evidence_links")
    .insert(rows);
  if (evErr) throw evErr;
  return rows.length;
}

export async function listListeningSignalRows(
  db: Db,
  organizationId: string,
  options?: {
    campaignId?: string;
    analysisRunId?: string;
  }
): Promise<ListeningSignalRow[]> {
  const org = requireOrg(organizationId);
  let q = db
    .from("listening_signals")
    .select(
      "id, organization_id, campaign_id, analysis_run_id, signal_kind, signal_type, title, summary, status, confidence, created_at, metadata"
    )
    .eq("organization_id", org)
    .order("created_at", { ascending: false });
  if (options?.campaignId) q = q.eq("campaign_id", options.campaignId);
  if (options?.analysisRunId) q = q.eq("analysis_run_id", options.analysisRunId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      id: String(row.id),
      organizationId: String(row.organization_id),
      campaignId: String(row.campaign_id),
      analysisRunId: row.analysis_run_id ? String(row.analysis_run_id) : null,
      signalKind: String(row.signal_kind),
      signalType: String(row.signal_type),
      signalClass: asClass(meta.listening_class),
      title: String(row.title),
      description: String(row.summary ?? ""),
      status: String(row.status),
      confidence:
        row.confidence == null ? null : Number(row.confidence),
      supportCount: Number(meta.support_count ?? 0),
      instrumentId: meta.instrument_id ? String(meta.instrument_id) : null,
      instrumentVersionId: meta.instrument_version_id
        ? String(meta.instrument_version_id)
        : null,
      createdAt: String(row.created_at),
      metadata: meta,
    };
  });
}

export async function listEvidenceForSignal(
  db: Db,
  organizationId: string,
  signalId: string,
  options?: { includeRawExcerpts?: boolean }
): Promise<ListeningEvidenceRow[]> {
  const org = requireOrg(organizationId);
  // Ensure signal belongs to org (cross-org isolation).
  const { data: signal, error: sigErr } = await db
    .from("listening_signals")
    .select("id")
    .eq("organization_id", org)
    .eq("id", signalId)
    .maybeSingle();
  if (sigErr) throw sigErr;
  if (!signal) throw new Error("listening_signal_not_found");

  const { data, error } = await db
    .from("listening_evidence_links")
    .select(
      "id, signal_id, evidence_kind, answer_id, question_id, response_id, label, payload, created_at, organization_id"
    )
    .eq("organization_id", org)
    .eq("signal_id", signalId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const payload = { ...((row.payload ?? {}) as Record<string, unknown>) };
    if (!options?.includeRawExcerpts) {
      delete payload.excerpt;
      delete payload.text;
      delete payload.raw;
    }
    return {
      id: String(row.id),
      signalId: String(row.signal_id),
      evidenceKind: String(row.evidence_kind),
      answerId: row.answer_id ? String(row.answer_id) : null,
      questionId: row.question_id ? String(row.question_id) : null,
      responseId: row.response_id ? String(row.response_id) : null,
      label: String(row.label ?? ""),
      payload,
      createdAt: String(row.created_at),
    };
  });
}

export async function listListeningAnalysisRunRows(
  db: Db,
  organizationId: string,
  options?: { campaignId?: string; limit?: number }
): Promise<
  readonly {
    id: string;
    organization_id: string;
    campaign_id: string;
    status: string;
    created_at: string;
    completed_at: string | null;
    metadata: Record<string, unknown>;
    error_summary: string | null;
  }[]
> {
  const org = requireOrg(organizationId);
  let q = db
    .from("listening_analysis_runs")
    .select(
      "id, organization_id, campaign_id, status, created_at, completed_at, metadata, error_summary"
    )
    .eq("organization_id", org)
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 50);
  if (options?.campaignId) q = q.eq("campaign_id", options.campaignId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    organization_id: String(row.organization_id),
    campaign_id: String(row.campaign_id),
    status: String(row.status),
    created_at: String(row.created_at),
    completed_at: row.completed_at ? String(row.completed_at) : null,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    error_summary: row.error_summary ? String(row.error_summary) : null,
  }));
}

export async function loadLatestCampaignMetrics(
  db: Db,
  organizationId: string,
  campaignId: string
): Promise<ListeningCampaignMetrics | null> {
  const org = requireOrg(organizationId);
  const { data, error } = await db
    .from("listening_analysis_runs")
    .select("metadata, status")
    .eq("organization_id", org)
    .eq("campaign_id", campaignId)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const meta = (data.metadata ?? {}) as { metrics?: ListeningCampaignMetrics };
  return meta.metrics ?? null;
}

export async function loadCampaignAnalysisSource(
  db: Db,
  organizationId: string,
  campaignId: string
) {
  const org = requireOrg(organizationId);
  const { data: campaign, error: cErr } = await db
    .from("listening_campaigns")
    .select(
      "id, organization_id, initiative_id, instrument_version_id, title, status"
    )
    .eq("organization_id", org)
    .eq("id", campaignId)
    .maybeSingle();
  if (cErr) throw cErr;
  if (!campaign) throw new Error("listening_campaign_not_found");

  const versionId = String(campaign.instrument_version_id);
  const { data: version, error: vErr } = await db
    .from("listening_instrument_versions")
    .select("id, instrument_id")
    .eq("organization_id", org)
    .eq("id", versionId)
    .maybeSingle();
  if (vErr) throw vErr;

  const { data: questions, error: qErr } = await db
    .from("listening_questions")
    .select("id, question_type, prompt, required, display_order")
    .eq("organization_id", org)
    .eq("instrument_version_id", versionId)
    .order("display_order", { ascending: true });
  if (qErr) throw qErr;

  const questionIds = (questions ?? []).map((q) => q.id);
  let options: {
    question_id: string;
    option_key: string;
    label: string;
  }[] = [];
  if (questionIds.length > 0) {
    const { data: opts, error: oErr } = await db
      .from("listening_question_options")
      .select("question_id, option_key, label")
      .eq("organization_id", org)
      .in("question_id", questionIds);
    if (oErr) throw oErr;
    options = opts ?? [];
  }

  const { data: responses, error: rErr } = await db
    .from("listening_responses")
    .select("id, status")
    .eq("organization_id", org)
    .eq("campaign_id", campaignId);
  if (rErr) throw rErr;

  const responseIds = (responses ?? []).map((r) => r.id);
  let answers: {
    id: string;
    response_id: string;
    question_id: string;
    question_type: string;
    value: unknown;
  }[] = [];
  if (responseIds.length > 0) {
    const { data: ans, error: aErr } = await db
      .from("listening_answers")
      .select("id, response_id, question_id, question_type, value")
      .eq("organization_id", org)
      .in("response_id", responseIds);
    if (aErr) throw aErr;
    answers = ans ?? [];
  }

  const optionsByQuestion = new Map<string, { option_key: string; label: string }[]>();
  for (const o of options) {
    const list = optionsByQuestion.get(o.question_id) ?? [];
    list.push({ option_key: o.option_key, label: o.label });
    optionsByQuestion.set(o.question_id, list);
  }

  return {
    campaign,
    instrumentId: version?.instrument_id ? String(version.instrument_id) : null,
    instrumentVersionId: versionId,
    questions: (questions ?? []).map((q) => ({
      id: String(q.id),
      question_type: String(q.question_type),
      prompt: String(q.prompt),
      required: Boolean(q.required),
      options: optionsByQuestion.get(q.id) ?? [],
    })),
    responses: (responses ?? []).map((r) => ({
      id: String(r.id),
      status: String(r.status),
    })),
    answers: answers.map((a) => ({
      id: String(a.id),
      response_id: String(a.response_id),
      question_id: String(a.question_id),
      question_type: String(a.question_type),
      value: a.value,
    })),
  };
}
