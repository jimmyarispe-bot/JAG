import type {
  IntelligenceDomain,
  IntelligenceSignal,
  IntelligenceSignalKey,
  PlatformDataSnapshot,
} from "@/lib/platform/intelligence/executive-layer/types";

type SignalDraft = {
  key: IntelligenceSignalKey;
  domain: IntelligenceDomain;
  label: string;
  value: number | null | undefined;
  previousValue?: number | null | undefined;
  unit: string | null;
  source: string;
  meta?: IntelligenceSignal["meta"];
};

function isPresent(value: number | null | undefined): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

function buildSignal(draft: SignalDraft, observedAt: string, orgId: string | null): IntelligenceSignal | null {
  if (!isPresent(draft.value) && !isPresent(draft.previousValue ?? null)) {
    return null;
  }
  // Require a current value for a factual observation.
  if (!isPresent(draft.value)) return null;

  return {
    id: `signal:${draft.key}:${orgId ?? "platform"}`,
    key: draft.key,
    domain: draft.domain,
    label: draft.label,
    value: draft.value,
    previousValue: isPresent(draft.previousValue ?? null) ? draft.previousValue! : null,
    unit: draft.unit,
    observedAt,
    source: draft.source,
    meta: draft.meta ?? {},
  };
}

/**
 * Normalize platform facts into deterministic signals.
 * Factual observations only — no interpretation.
 */
export function collectSignals(snapshot: PlatformDataSnapshot): IntelligenceSignal[] {
  const observedAt = snapshot.observedAt ?? "1970-01-01T00:00:00.000Z";
  const orgId = snapshot.organizationId ?? null;
  const drafts: SignalDraft[] = [
    {
      key: "admissions.new_applications",
      domain: "admissions",
      label: "New applications",
      value: snapshot.admissions?.newApplications,
      previousValue: snapshot.admissions?.newApplicationsPrevious,
      unit: "count",
      source: "admissions",
    },
    {
      key: "admissions.stalled_applications",
      domain: "admissions",
      label: "Stalled applications",
      value: snapshot.admissions?.stalledApplications,
      unit: "count",
      source: "admissions",
      meta: { stalledDaysThreshold: 7 },
    },
    {
      key: "admissions.acceptance_rate",
      domain: "admissions",
      label: "Acceptance rate",
      value: snapshot.admissions?.acceptanceRate,
      previousValue: snapshot.admissions?.acceptanceRatePrevious,
      unit: "%",
      source: "admissions",
    },
    {
      key: "students.enrollment_change",
      domain: "students",
      label: "Active students",
      value: snapshot.students?.activeStudents,
      previousValue: snapshot.students?.activeStudentsPrevious,
      unit: "count",
      source: "students",
    },
    {
      key: "students.attendance_rate",
      domain: "students",
      label: "Attendance rate",
      value: snapshot.students?.attendanceRate,
      previousValue: snapshot.students?.attendanceRatePrevious,
      unit: "%",
      source: "students",
    },
    {
      key: "finance.outstanding_balances",
      domain: "finance",
      label: "Outstanding balances",
      value: snapshot.finance?.outstandingBalances,
      previousValue: snapshot.finance?.outstandingBalancesPrevious,
      unit: "USD",
      source: "finance",
    },
    {
      key: "finance.tuition_collection_rate",
      domain: "finance",
      label: "Tuition collection rate",
      value: snapshot.finance?.tuitionCollectionRate,
      previousValue: snapshot.finance?.tuitionCollectionRatePrevious,
      unit: "%",
      source: "finance",
    },
    {
      key: "staff.open_positions",
      domain: "staff",
      label: "Open positions",
      value: snapshot.staff?.openPositions,
      unit: "count",
      source: "staff",
    },
    {
      key: "staff.missing_timesheets",
      domain: "staff",
      label: "Missing timesheets",
      value: snapshot.staff?.missingTimesheets,
      unit: "count",
      source: "staff",
    },
    {
      key: "technology.failed_jobs",
      domain: "technology",
      label: "Failed jobs",
      value: snapshot.technology?.failedJobs,
      unit: "count",
      source: "technology",
    },
    {
      key: "technology.auth_failures",
      domain: "technology",
      label: "Authentication failures",
      value: snapshot.technology?.authFailures,
      unit: "count",
      source: "technology",
    },
    {
      key: "platform.migration_pending",
      domain: "platform",
      label: "Pending migrations",
      value: snapshot.platform?.pendingMigrations,
      unit: "count",
      source: "platform",
    },
    {
      key: "platform.background_job_health",
      domain: "platform",
      label: "Background job health",
      value: snapshot.platform?.backgroundJobHealthScore,
      unit: "score",
      source: "platform",
    },
  ];

  const signals: IntelligenceSignal[] = [];
  for (const draft of drafts) {
    const signal = buildSignal(draft, observedAt, orgId);
    if (signal) signals.push(signal);
  }

  // Stable order by key for reproducibility.
  return signals.sort((a, b) => a.key.localeCompare(b.key));
}

export function pctChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function findSignal(
  signals: IntelligenceSignal[],
  key: IntelligenceSignalKey
): IntelligenceSignal | undefined {
  return signals.find((s) => s.key === key);
}
