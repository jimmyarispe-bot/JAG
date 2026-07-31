import { detectAnomalies } from "@/lib/platform/intelligence/executive-layer/anomalies";
import { buildIntelligenceBrief } from "@/lib/platform/intelligence/executive-layer/briefing";
import { generateInsights } from "@/lib/platform/intelligence/executive-layer/insights";
import { prioritizeInsights } from "@/lib/platform/intelligence/executive-layer/priorities";
import { generateRecommendations } from "@/lib/platform/intelligence/executive-layer/recommendations";
import { collectSignals } from "@/lib/platform/intelligence/executive-layer/signals";
import type {
  ExecutiveIntelligenceResult,
  PlatformDataSnapshot,
} from "@/lib/platform/intelligence/executive-layer/types";
import type { FounderMetric } from "@/lib/platform/founder/types";

/**
 * Pure pipeline: Platform Data → Signals → Insights → Priorities → Brief.
 * Each stage is independently testable via exported stage functions.
 */
export function runExecutiveIntelligencePipeline(
  snapshot: PlatformDataSnapshot
): ExecutiveIntelligenceResult {
  const generatedAt = snapshot.observedAt ?? "1970-01-01T00:00:00.000Z";
  const signals = collectSignals(snapshot);
  const anomalies = detectAnomalies(signals);
  const insights = generateInsights(signals, anomalies);
  const priorities = prioritizeInsights(insights, signals);
  const recommendations = generateRecommendations(priorities, signals);
  const brief = buildIntelligenceBrief({ priorities, recommendations });

  return {
    generatedAt,
    organizationId: snapshot.organizationId ?? null,
    signals,
    anomalies,
    insights,
    priorities,
    recommendations,
    brief,
  };
}

/**
 * Map Founder metrics into a PlatformDataSnapshot.
 * Only factual values already present are used; prior-period values come from extras.
 */
export function snapshotFromFounderMetrics(input: {
  organizationId?: string | null;
  metrics: FounderMetric[];
  observedAt?: string;
  extras?: Partial<PlatformDataSnapshot>;
}): PlatformDataSnapshot {
  const byKey = Object.fromEntries(input.metrics.map((m) => [m.key, m]));
  const collected = byKey.tuition_collected?.value ?? null;
  const outstanding = byKey.outstanding_balances?.value ?? null;
  const collectionRate =
    collected != null &&
    outstanding != null &&
    collected + outstanding > 0
      ? Math.round((collected / (collected + outstanding)) * 1000) / 10
      : null;

  const extras = input.extras ?? {};

  return {
    organizationId: input.organizationId ?? null,
    observedAt: input.observedAt,
    admissions: {
      newApplications: byKey.new_applications?.value ?? null,
      newApplicationsPrevious: extras.admissions?.newApplicationsPrevious ?? null,
      stalledApplications: extras.admissions?.stalledApplications ?? null,
      acceptanceRate: extras.admissions?.acceptanceRate ?? null,
      acceptanceRatePrevious: extras.admissions?.acceptanceRatePrevious ?? null,
    },
    students: {
      activeStudents: byKey.active_students?.value ?? null,
      activeStudentsPrevious: extras.students?.activeStudentsPrevious ?? null,
      attendanceRate: byKey.attendance?.value ?? null,
      attendanceRatePrevious: extras.students?.attendanceRatePrevious ?? null,
    },
    finance: {
      outstandingBalances: outstanding,
      outstandingBalancesPrevious: extras.finance?.outstandingBalancesPrevious ?? null,
      tuitionCollectionRate:
        extras.finance?.tuitionCollectionRate ?? collectionRate,
      tuitionCollectionRatePrevious:
        extras.finance?.tuitionCollectionRatePrevious ?? null,
    },
    staff: {
      openPositions: extras.staff?.openPositions ?? null,
      missingTimesheets: extras.staff?.missingTimesheets ?? null,
    },
    technology: {
      failedJobs: extras.technology?.failedJobs ?? null,
      authFailures: extras.technology?.authFailures ?? null,
    },
    platform: {
      pendingMigrations: extras.platform?.pendingMigrations ?? null,
      backgroundJobHealthScore:
        extras.platform?.backgroundJobHealthScore ??
        byKey.system_health?.value ??
        null,
    },
  };
}

export const ExecutiveIntelligenceService = {
  /** Run the full deterministic intelligence pipeline. */
  analyze(snapshot: PlatformDataSnapshot): ExecutiveIntelligenceResult {
    return runExecutiveIntelligencePipeline(snapshot);
  },

  analyzeFromFounderMetrics(input: {
    organizationId?: string | null;
    metrics: FounderMetric[];
    observedAt?: string;
    extras?: Partial<PlatformDataSnapshot>;
  }): ExecutiveIntelligenceResult {
    return runExecutiveIntelligencePipeline(snapshotFromFounderMetrics(input));
  },
} as const;
