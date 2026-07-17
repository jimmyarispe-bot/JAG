/**
 * Academic Health Engine — stub (Sprint 023).
 * A.1 remediation: do not report a false "critical" score that poisons aggregates.
 */

export interface AcademicHealthResult {
  score: number;
  status: "excellent" | "healthy" | "warning" | "critical" | "unavailable";
  /** When true, score must not be treated as measured operational truth. */
  stub: boolean;
}

/**
 * Returns an explicit unavailable stub until real academic sources are wired.
 * Overall organization-health aggregation should ignore stub:true scores.
 */
export async function evaluateAcademicHealth(): Promise<AcademicHealthResult> {
  return { score: 0, status: "unavailable", stub: true };
}
