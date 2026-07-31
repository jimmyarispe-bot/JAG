/**
 * Executive Intelligence Layer v1 (Sprint 064).
 * Deterministic pipeline: Data → Signals → Insights → Priorities → Brief.
 * No LLM. No predictive analytics.
 */

export type IntelligenceDomain =
  | "admissions"
  | "students"
  | "finance"
  | "staff"
  | "technology"
  | "platform";

export type IntelligencePriorityLevel = "critical" | "high" | "medium" | "low";

export type IntelligenceSignalKey =
  | "admissions.new_applications"
  | "admissions.stalled_applications"
  | "admissions.acceptance_rate"
  | "students.enrollment_change"
  | "students.attendance_rate"
  | "finance.outstanding_balances"
  | "finance.tuition_collection_rate"
  | "staff.open_positions"
  | "staff.missing_timesheets"
  | "technology.failed_jobs"
  | "technology.auth_failures"
  | "platform.migration_pending"
  | "platform.background_job_health";

/** Factual observation only — no interpretation. */
export type IntelligenceSignal = {
  id: string;
  key: IntelligenceSignalKey;
  domain: IntelligenceDomain;
  label: string;
  /** Current observed value. */
  value: number | null;
  /** Prior-period value when known (for factual deltas). */
  previousValue: number | null;
  unit: string | null;
  observedAt: string;
  source: string;
  /** Optional entity counts / ids for traceability. */
  meta: Record<string, number | string | boolean | null>;
};

export type IntelligenceAnomaly = {
  id: string;
  signalId: string;
  signalKey: IntelligenceSignalKey;
  /** Factual description of the deviation (threshold-based). */
  observation: string;
  magnitudePct: number | null;
  thresholdPct: number;
};

export type IntelligenceInsight = {
  id: string;
  domain: IntelligenceDomain;
  /** Readable executive statement — template-driven, not LLM. */
  statement: string;
  signalIds: string[];
  anomalyIds: string[];
  supportingMetrics: Array<{
    key: string;
    label: string;
    value: number | null;
    unit: string | null;
  }>;
};

export type PrioritizedInsight = IntelligenceInsight & {
  priority: IntelligencePriorityLevel;
  priorityScore: number;
  priorityReason: string;
};

export type IntelligenceRecommendation = {
  id: string;
  action: string;
  priority: IntelligencePriorityLevel;
  /** Always traceable to signals. */
  signalIds: string[];
  insightIds: string[];
  domain: IntelligenceDomain;
};

export type IntelligenceBriefSectionId =
  | "platform_status"
  | "admissions"
  | "enrollment"
  | "attendance"
  | "finance"
  | "staffing"
  | "technology"
  | "security"
  | "critical_issues"
  | "ai_summary";

export type IntelligenceBriefSection = {
  id: IntelligenceBriefSectionId;
  title: string;
  keyInsight: string | null;
  supportingMetrics: Array<{
    key: string;
    label: string;
    value: number | null;
    unit: string | null;
  }>;
  recommendedActions: string[];
  insightIds: string[];
  recommendationIds: string[];
  priority: IntelligencePriorityLevel | null;
};

export type ExecutiveIntelligenceResult = {
  generatedAt: string;
  organizationId: string | null;
  signals: IntelligenceSignal[];
  anomalies: IntelligenceAnomaly[];
  insights: IntelligenceInsight[];
  priorities: PrioritizedInsight[];
  recommendations: IntelligenceRecommendation[];
  brief: {
    sections: IntelligenceBriefSection[];
    summary: string;
  };
};

/**
 * Injected platform facts for the signal engine.
 * All fields optional — missing data yields fewer signals (never invented).
 */
export type PlatformDataSnapshot = {
  organizationId?: string | null;
  observedAt?: string;
  admissions?: {
    newApplications?: number | null;
    newApplicationsPrevious?: number | null;
    stalledApplications?: number | null;
    acceptanceRate?: number | null;
    acceptanceRatePrevious?: number | null;
  };
  students?: {
    activeStudents?: number | null;
    activeStudentsPrevious?: number | null;
    attendanceRate?: number | null;
    attendanceRatePrevious?: number | null;
  };
  finance?: {
    outstandingBalances?: number | null;
    outstandingBalancesPrevious?: number | null;
    tuitionCollectionRate?: number | null;
    tuitionCollectionRatePrevious?: number | null;
  };
  staff?: {
    openPositions?: number | null;
    missingTimesheets?: number | null;
  };
  technology?: {
    failedJobs?: number | null;
    authFailures?: number | null;
  };
  platform?: {
    pendingMigrations?: number | null;
    backgroundJobHealthScore?: number | null;
  };
};
