/**
 * Deterministic thresholds for Executive Intelligence™ insight rules.
 * No ML / forecasting — explicit constants only.
 */

export const INSIGHT_THRESHOLDS = {
  financialAwaitingReview: 3,
  processingQueue: 10,
  processingFailures: 1,
  /** Manual / unknown schedule: treat as overdue after 7 days. */
  manualSyncStaleMs: 7 * 24 * 60 * 60 * 1000,
  dailySyncStaleMs: 25 * 60 * 60 * 1000,
  weeklySyncStaleMs: 8 * 24 * 60 * 60 * 1000,
  /** Evidence considered "new" for relationship checks. */
  newEvidenceMs: 30 * 24 * 60 * 60 * 1000,
  /** No evidence updates within this window → organizational inactivity. */
  orgActivityStaleMs: 14 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Required organizational coverage — checked only when the org has evidence.
 * Empty department list means the department rule is not configured.
 */
export const INSIGHT_ORG_REQUIREMENTS = {
  requiredBusinessUnits: ["Corporate", "Finance"] as readonly string[],
  requiredDepartments: [] as readonly string[],
};
