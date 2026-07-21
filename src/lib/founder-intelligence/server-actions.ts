"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { resolveActorUserId } from "@/lib/platform/shared/context";
import { requireFounderIntelligenceDecide, requireFounderIntelligenceView } from "./access";
import { recordFounderActivity } from "./activity";
import { composeFounderDashboard } from "./compose";
import {
  applyDecisionAction,
  createDecisionFromRecommendation,
  type DecisionAction,
} from "./decisions";
import { archiveFounderMemory, upsertFounderMemory } from "./memory";
import type { FounderRecommendation, MemoryType } from "./types";

function revalidateFounder() {
  revalidatePath("/dashboard/founder");
}

export async function refreshFounderIntelligenceAction(formData: FormData): Promise<void> {
  const access = await requireFounderIntelligenceView();
  if (!access.ok) return;
  const supabase = await createAuthClient();
  const organizationId = String(formData.get("organization_id") ?? "") || null;
  const schoolId = String(formData.get("school_id") ?? "") || null;
  const actorUserId = await resolveActorUserId(supabase);

  const bundle = await composeFounderDashboard(supabase, {
    organizationId,
    schoolId,
    seedDecisions: true,
  });

  await recordFounderActivity(supabase, {
    eventType: "founder.brief.generated",
    title: "Founder executive brief refreshed",
    summary: `Health ${bundle.overallHealth.score} · ${bundle.risks.length} risks`,
    entityId: organizationId ?? schoolId ?? "founder",
    entityType: "organization",
    organizationId,
    schoolId,
    actorUserId,
    payload: {
      signalDriven: true,
      recommendationCount: bundle.recommendations.length,
    },
  });
  await recordFounderActivity(supabase, {
    eventType: "founder.health.scored",
    title: "Organization health scored",
    summary: `Overall ${bundle.overallHealth.score}/100`,
    entityId: organizationId ?? "organization",
    organizationId,
    schoolId,
    actorUserId,
    payload: { score: bundle.overallHealth.score },
  });

  for (const risk of bundle.risks.slice(0, 2)) {
    await recordFounderActivity(supabase, {
      eventType: "founder.insight.created",
      title: risk.title,
      summary: risk.summary,
      entityId: risk.id,
      organizationId,
      schoolId,
      actorUserId,
      payload: { insightType: "risk", severity: risk.severity },
    });
  }

  for (const rec of bundle.recommendations.slice(0, 3)) {
    await recordFounderActivity(supabase, {
      eventType: "founder.recommendation.created",
      title: rec.title,
      summary: rec.summary,
      entityId: rec.id,
      organizationId,
      schoolId,
      actorUserId,
      payload: { priority: rec.priority, confidence: rec.confidence },
    });
  }

  revalidateFounder();
}

export async function founderDecisionAction(formData: FormData): Promise<void> {
  const access = await requireFounderIntelligenceDecide();
  if (!access.ok) return;
  const supabase = await createAuthClient();
  const decisionId = String(formData.get("decision_id") ?? "");
  const action = String(formData.get("action") ?? "") as DecisionAction;
  if (!decisionId || !action) return;

  await applyDecisionAction(supabase, {
    decisionId,
    action,
    note: String(formData.get("note") ?? "") || undefined,
    delegatedTo: String(formData.get("delegated_to") ?? "") || undefined,
    scheduledFor: String(formData.get("scheduled_for") ?? "") || undefined,
    triggerWorkflow: formData.get("trigger_workflow") !== "false",
  });
  revalidateFounder();
}

export async function queueRecommendationDecisionAction(formData: FormData): Promise<void> {
  const access = await requireFounderIntelligenceDecide();
  if (!access.ok) return;
  const supabase = await createAuthClient();

  const recommendation: FounderRecommendation = {
    id: String(formData.get("recommendation_id") ?? `rec-${Date.now()}`),
    title: String(formData.get("title") ?? "Recommendation"),
    summary: String(formData.get("summary") ?? ""),
    domain: (String(formData.get("domain") ?? "organization") as FounderRecommendation["domain"]),
    priority: Number(formData.get("priority") ?? 50),
    impact: String(formData.get("impact") ?? ""),
    confidence: Number(formData.get("confidence") ?? 0.7),
    relatedEntities: [],
    suggestedActions: String(formData.get("suggested_actions") ?? "")
      .split("|")
      .filter(Boolean),
    explainability: {
      why: String(formData.get("why") ?? "Queued from Founder dashboard"),
      evidence: [],
      relatedEventIds: [],
      confidence: Number(formData.get("confidence") ?? 0.7),
      lastUpdated: new Date().toISOString(),
    },
  };

  await createDecisionFromRecommendation(supabase, {
    organizationId: String(formData.get("organization_id") ?? "") || null,
    schoolId: String(formData.get("school_id") ?? "") || null,
    recommendation,
  });
  revalidateFounder();
}

export async function saveFounderMemoryAction(formData: FormData): Promise<void> {
  const access = await requireFounderIntelligenceDecide();
  if (!access.ok) return;
  const supabase = await createAuthClient();
  await upsertFounderMemory(supabase, {
    organizationId: String(formData.get("organization_id") ?? "") || null,
    schoolId: String(formData.get("school_id") ?? "") || null,
    memoryType: String(formData.get("memory_type") ?? "note") as MemoryType,
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    pinned: formData.get("pinned") === "true",
  });
  revalidateFounder();
}

export async function archiveFounderMemoryAction(memoryId: string): Promise<void> {
  const access = await requireFounderIntelligenceDecide();
  if (!access.ok) return;
  const supabase = await createAuthClient();
  await archiveFounderMemory(supabase, memoryId);
  revalidateFounder();
}
