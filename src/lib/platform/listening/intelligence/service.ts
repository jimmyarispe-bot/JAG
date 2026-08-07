/**
 * Listening Intelligence Engine — organization-scoped services.
 *
 * Permissions:
 * - runListeningAnalysis: LISTENING_ANALYZE + LISTENING_RAW (needs raw answers)
 * - listListeningSignals: LISTENING_VIEW or LISTENING_ANALYZE
 * - getSignalEvidence: LISTENING_ANALYZE or LISTENING_RAW
 *   (excerpts only with LISTENING_RAW)
 * - listCampaignMetrics: LISTENING_VIEW or LISTENING_ANALYZE
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  userHasPermission,
} from "@/lib/platform/identity/permissions";
import { planListeningAnalysis } from "./pipeline";
import {
  listEvidenceForSignal,
  listListeningSignalRows,
  loadCampaignAnalysisSource,
  loadLatestCampaignMetrics,
  persistListeningAnalysisRun,
} from "./repository";
import type {
  ListeningAnalysisRunResult,
  ListeningCampaignMetrics,
  ListeningEvidenceRow,
  ListeningSignalRow,
  ListeningThemeGrouper,
} from "./types";

export type ListeningIntelligenceAccess = {
  readonly canView: boolean;
  readonly canAnalyze: boolean;
  readonly canRaw: boolean;
};

export async function resolveListeningIntelligenceAccess(
  db: SupabaseClient
): Promise<ListeningIntelligenceAccess> {
  const [canView, canAnalyze, canRaw] = await Promise.all([
    userHasPermission(db, "LISTENING_VIEW"),
    userHasPermission(db, "LISTENING_ANALYZE"),
    userHasPermission(db, "LISTENING_RAW"),
  ]);
  return {
    canView: canView || canAnalyze,
    canAnalyze,
    canRaw,
  };
}

export async function runListeningAnalysis(
  db: SupabaseClient,
  input: {
    organizationId: string;
    campaignId: string;
    createdBy?: string | null;
    grouper?: ListeningThemeGrouper;
  }
): Promise<ListeningAnalysisRunResult> {
  const access = await resolveListeningIntelligenceAccess(db);
  if (!access.canAnalyze) {
    throw new Error("listening_permission_analyze_required");
  }
  if (!access.canRaw) {
    throw new Error("listening_permission_raw_required");
  }

  const source = await loadCampaignAnalysisSource(
    db,
    input.organizationId,
    input.campaignId
  );

  const plan = planListeningAnalysis({
    responses: source.responses,
    questions: source.questions,
    answers: source.answers,
    grouper: input.grouper,
  });

  return persistListeningAnalysisRun(db, {
    organizationId: input.organizationId,
    campaignId: input.campaignId,
    instrumentId: source.instrumentId,
    instrumentVersionId: source.instrumentVersionId,
    createdBy: input.createdBy,
    plan,
  });
}

export async function listListeningSignals(
  db: SupabaseClient,
  input: {
    organizationId: string;
    campaignId?: string;
    analysisRunId?: string;
  }
): Promise<ListeningSignalRow[]> {
  const access = await resolveListeningIntelligenceAccess(db);
  if (!access.canView) {
    throw new Error("listening_permission_view_required");
  }
  return listListeningSignalRows(db, input.organizationId, {
    campaignId: input.campaignId,
    analysisRunId: input.analysisRunId,
  });
}

export async function getSignalEvidence(
  db: SupabaseClient,
  input: {
    organizationId: string;
    signalId: string;
  }
): Promise<ListeningEvidenceRow[]> {
  const access = await resolveListeningIntelligenceAccess(db);
  if (!access.canAnalyze && !access.canRaw) {
    throw new Error("listening_permission_evidence_required");
  }
  return listEvidenceForSignal(db, input.organizationId, input.signalId, {
    includeRawExcerpts: access.canRaw,
  });
}

export async function listCampaignMetrics(
  db: SupabaseClient,
  input: {
    organizationId: string;
    campaignId: string;
  }
): Promise<ListeningCampaignMetrics | null> {
  const access = await resolveListeningIntelligenceAccess(db);
  if (!access.canView) {
    throw new Error("listening_permission_view_required");
  }
  return loadLatestCampaignMetrics(
    db,
    input.organizationId,
    input.campaignId
  );
}
