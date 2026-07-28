/**
 * Finance core invariants.
 */

export const FINANCE_FOUNDATION_GUARDS = Object.freeze({
  canonicalModel: true,
  multiEntity: true,
  industryAgnostic: true,
  governanceAware: true,
  aiReady: true,
  /** Explicit out-of-scope for P-008 */
  includesReconciliation: false,
  includesAiCfo: false,
  includesForecasting: false,
  includesEbitda: false,
});
