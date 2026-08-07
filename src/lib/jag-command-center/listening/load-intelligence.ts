import {
  getSignalEvidence,
  listCampaignMetrics,
  listListeningSignals,
  resolveListeningIntelligenceAccess,
} from "@/lib/platform/listening/intelligence/service";
import { listListeningAnalysisRunRows } from "@/lib/platform/listening/intelligence/repository";
import {
  compareListeningCampaignSignals,
  filterListeningSignals,
  type ListeningAnalysisRunSummary,
  type ListeningCampaignCompareResult,
  type ListeningCampaignMetrics,
  type ListeningEvidenceRow,
  type ListeningWorkbenchFilters,
} from "@/lib/platform/listening/intelligence";
import {
  listListeningCampaigns,
  listListeningInitiatives,
  listListeningInstruments,
} from "@/lib/platform/listening";
import { resolveListeningAccess } from "./access";
import type { ListeningIntelligenceWorkbenchModel } from "./intelligence-types";

export type { ListeningIntelligenceWorkbenchModel } from "./intelligence-types";

function parseFilters(
  search: Record<string, string | undefined>
): ListeningWorkbenchFilters {
  return {
    campaignId: search.campaign || null,
    initiativeId: search.initiative || null,
    instrumentId: search.instrument || null,
    segmentId: search.segment || null,
    signalClass: (search.type as ListeningWorkbenchFilters["signalClass"]) || null,
    questionId: search.question || null,
    dateFrom: search.from || null,
    dateTo: search.to || null,
    query: search.q || null,
    sort:
      search.sort === "confidence" ||
      search.sort === "recent" ||
      search.sort === "title" ||
      search.sort === "support"
        ? search.sort
        : "support",
  };
}

export async function loadListeningIntelligenceWorkbench(
  preferredOrgId?: string | null,
  search: Record<string, string | undefined> = {}
): Promise<
  | { ok: true; model: ListeningIntelligenceWorkbenchModel }
  | { ok: false; error: string }
> {
  const access = await resolveListeningAccess(preferredOrgId);
  if (!access.ok) return access;

  const intel = await resolveListeningIntelligenceAccess(access.supabase);
  if (!intel.canView) {
    return { ok: false, error: "LISTENING_VIEW or LISTENING_ANALYZE required." };
  }

  const filters = parseFilters(search);
  const org = access.organizationId;

  const [campaigns, initiatives, instruments, runRows, signals] =
    await Promise.all([
      listListeningCampaigns(access.supabase, org),
      listListeningInitiatives(access.supabase, org),
      listListeningInstruments(access.supabase, org),
      listListeningAnalysisRunRows(access.supabase, org, { limit: 40 }),
      listListeningSignals(access.supabase, { organizationId: org }),
    ]);

  // Segments for filter UI (campaign-targeted segments).
  const { data: segmentRows } = await access.supabase
    .from("listening_segments")
    .select("id, label")
    .eq("organization_id", org)
    .order("label", { ascending: true });

  const campaignMap = new Map(
    campaigns.map((c) => [
      String(c.id),
      {
        title: String(c.title),
        initiativeId: c.initiative_id ? String(c.initiative_id) : null,
        instrumentVersionId: String(c.instrument_version_id),
      },
    ])
  );
  const instrumentByVersion = new Map<string, { id: string; title: string }>();
  // Resolve instrument titles via versions when possible
  for (const inst of instruments) {
    void inst;
  }
  const { data: versions } = await access.supabase
    .from("listening_instrument_versions")
    .select("id, instrument_id")
    .eq("organization_id", org);
  const instrumentTitle = new Map(
    instruments.map((i) => [String(i.id), String(i.title)] as const)
  );
  for (const v of versions ?? []) {
    instrumentByVersion.set(String(v.id), {
      id: String(v.instrument_id),
      title: instrumentTitle.get(String(v.instrument_id)) ?? "Instrument",
    });
  }

  const campaignInitiative = new Map<string, string | null>();
  for (const [id, c] of campaignMap) {
    campaignInitiative.set(id, c.initiativeId);
  }

  const runs: ListeningAnalysisRunSummary[] = runRows.map((r) => {
    const meta = r.metadata ?? {};
    const metrics = meta.metrics as
      | { completionRate?: number }
      | undefined;
    const campaign = campaignMap.get(r.campaign_id);
    const instrumentId =
      meta.instrument_id != null
        ? String(meta.instrument_id)
        : campaign
          ? instrumentByVersion.get(campaign.instrumentVersionId)?.id ?? null
          : null;
    const instrumentTitleResolved =
      instrumentId != null
        ? instrumentTitle.get(instrumentId) ?? null
        : campaign
          ? instrumentByVersion.get(campaign.instrumentVersionId)?.title ?? null
          : null;

    return {
      id: r.id,
      organizationId: r.organization_id,
      campaignId: r.campaign_id,
      campaignTitle: campaign?.title ?? "Campaign",
      instrumentId,
      instrumentTitle: instrumentTitleResolved,
      initiativeId: campaign?.initiativeId ?? null,
      status: r.status,
      runDate: r.completed_at ?? r.created_at,
      completionRate:
        typeof metrics?.completionRate === "number"
          ? metrics.completionRate
          : null,
      signalCount: Number(meta.signal_count ?? 0),
      evidenceCount: Number(meta.evidence_count ?? 0),
    };
  });

  const filteredSignals = filterListeningSignals(signals, filters, {
    campaignInitiative,
  });

  // Questions for filter — from filtered campaign or all signals' metadata.
  const questionIds = new Set<string>();
  for (const s of signals) {
    const qid = s.metadata.question_id;
    if (qid) questionIds.add(String(qid));
  }
  let questions: { id: string; prompt: string }[] = [];
  if (questionIds.size > 0) {
    const { data: qRows } = await access.supabase
      .from("listening_questions")
      .select("id, prompt")
      .eq("organization_id", org)
      .in("id", [...questionIds]);
    questions = (qRows ?? []).map((q) => ({
      id: String(q.id),
      prompt: String(q.prompt),
    }));
  }

  const selectedSignalId = search.signal?.trim() || null;
  let selectedSignal =
    filteredSignals.find((s) => s.id === selectedSignalId) ??
    signals.find((s) => s.id === selectedSignalId) ??
    null;

  let evidence: ListeningEvidenceRow[] = [];
  if (selectedSignal && (intel.canAnalyze || intel.canRaw)) {
    try {
      evidence = await getSignalEvidence(access.supabase, {
        organizationId: org,
        signalId: selectedSignal.id,
      });
    } catch {
      evidence = [];
    }
  } else if (selectedSignal && !intel.canAnalyze && !intel.canRaw) {
    selectedSignal = selectedSignal;
  }

  const metricsCampaignId =
    filters.campaignId ||
    selectedSignal?.campaignId ||
    runs[0]?.campaignId ||
    null;
  let metrics: ListeningCampaignMetrics | null = null;
  if (metricsCampaignId) {
    try {
      metrics = await listCampaignMetrics(access.supabase, {
        organizationId: org,
        campaignId: metricsCampaignId,
      });
    } catch {
      metrics = null;
    }
  }

  const compareA = search.compareA?.trim() || null;
  const compareB = search.compareB?.trim() || null;
  let comparison: ListeningCampaignCompareResult | null = null;
  if (compareA && compareB && compareA !== compareB) {
    comparison = compareListeningCampaignSignals(
      signals.filter((s) => s.campaignId === compareA),
      signals.filter((s) => s.campaignId === compareB),
      compareA,
      compareB
    );
  }

  return {
    ok: true,
    model: {
      organizationId: org,
      organizationName: access.organizationName,
      canAnalyze: access.canAnalyze && access.canRaw,
      canRaw: access.canRaw,
      canViewEvidence: intel.canAnalyze || intel.canRaw,
      runs,
      signals,
      filteredSignals,
      filters,
      campaigns: campaigns.map((c) => ({
        id: String(c.id),
        title: String(c.title),
        initiativeId: c.initiative_id ? String(c.initiative_id) : null,
        instrumentVersionId: String(c.instrument_version_id),
      })),
      initiatives: initiatives.map((i) => ({
        id: String(i.id),
        title: String(i.title),
      })),
      instruments: instruments.map((i) => ({
        id: String(i.id),
        title: String(i.title),
      })),
      segments: (segmentRows ?? []).map((s) => ({
        id: String(s.id),
        label: String(s.label),
      })),
      questions,
      selectedSignal,
      evidence,
      metrics,
      comparison,
      compareCampaignA: compareA,
      compareCampaignB: compareB,
    },
  };
}
