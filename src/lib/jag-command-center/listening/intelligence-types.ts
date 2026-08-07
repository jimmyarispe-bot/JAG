import type {
  ListeningAnalysisRunSummary,
  ListeningCampaignCompareResult,
  ListeningCampaignMetrics,
  ListeningEvidenceRow,
  ListeningSignalRow,
  ListeningWorkbenchFilters,
} from "@/lib/platform/listening/intelligence";

export type ListeningIntelligenceWorkbenchModel = {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly canAnalyze: boolean;
  readonly canRaw: boolean;
  readonly canViewEvidence: boolean;
  readonly runs: readonly ListeningAnalysisRunSummary[];
  readonly signals: readonly ListeningSignalRow[];
  readonly filteredSignals: readonly ListeningSignalRow[];
  readonly filters: ListeningWorkbenchFilters;
  readonly campaigns: readonly {
    id: string;
    title: string;
    initiativeId: string | null;
    instrumentVersionId: string;
  }[];
  readonly initiatives: readonly { id: string; title: string }[];
  readonly instruments: readonly { id: string; title: string }[];
  readonly segments: readonly { id: string; label: string }[];
  readonly questions: readonly { id: string; prompt: string }[];
  readonly selectedSignal: ListeningSignalRow | null;
  readonly evidence: readonly ListeningEvidenceRow[];
  readonly metrics: ListeningCampaignMetrics | null;
  readonly comparison: ListeningCampaignCompareResult | null;
  readonly compareCampaignA: string | null;
  readonly compareCampaignB: string | null;
};
