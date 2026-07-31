import type { OperationalFacts } from "@/lib/platform/automation/operating/types";

type SignalLike = { key: string; value: unknown };

/**
 * Build operational facts for automation triggers.
 * Deterministic mapping from known platform signals / counts — no AI.
 */
export function buildOperationalFacts(input: {
  organizationId: string | null;
  applicationId?: string | null;
  observedAt: string;
  stalledApplications?: number | null;
  outstandingBalances?: number | null;
  failedJobs?: number | null;
  missingTimesheets?: number | null;
}): OperationalFacts {
  const facts: OperationalFacts = {
    organizationId: input.organizationId,
    applicationId: input.applicationId ?? "academyos",
    observedAt: input.observedAt,
  };

  const stalled = input.stalledApplications ?? 0;
  if (stalled > 0) {
    facts.admissions = {
      applications: Array.from({ length: Math.min(stalled, 5) }, (_, i) => ({
        id: `stalled-app-${input.organizationId ?? "platform"}-${i + 1}`,
        status: "review",
        review_days: 8 + i,
      })),
    };
  }

  const outstanding = input.outstandingBalances ?? 0;
  if (outstanding > 0) {
    facts.finance = {
      overdue_payments: [
        {
          id: `tuition-${input.organizationId ?? "platform"}`,
          days_overdue: 14,
          amount: outstanding,
        },
      ],
    };
  }

  const failedJobs = input.failedJobs ?? 0;
  if (failedJobs > 0) {
    facts.platform = {
      failed_jobs: Array.from({ length: Math.min(failedJobs, 3) }, (_, i) => ({
        id: `job-${input.organizationId ?? "platform"}-${i + 1}`,
        name: "scheduled-job",
      })),
    };
  }

  const missingTimesheets = input.missingTimesheets ?? 0;
  if (missingTimesheets > 0) {
    facts.hr = {
      missing_timesheets: Array.from(
        { length: Math.min(missingTimesheets, 5) },
        (_, i) => ({
          id: `timesheet-${input.organizationId ?? "platform"}-${i + 1}`,
          employee_id: `employee-${i + 1}`,
          period: "current",
        })
      ),
    };
  }

  return facts;
}

/** Read numeric signal values from an Executive Intelligence result (consume only). */
export function factsFromIntelligenceSignals(input: {
  organizationId: string | null;
  applicationId?: string | null;
  observedAt: string;
  signals: SignalLike[];
}): OperationalFacts {
  const num = (key: string): number | null => {
    const hit = input.signals.find((s) => s.key === key);
    return typeof hit?.value === "number" ? hit.value : null;
  };

  return buildOperationalFacts({
    organizationId: input.organizationId,
    applicationId: input.applicationId,
    observedAt: input.observedAt,
    stalledApplications: num("admissions.stalled_applications"),
    outstandingBalances: num("finance.outstanding_balances"),
    failedJobs: num("technology.failed_jobs"),
    missingTimesheets: num("staff.missing_timesheets"),
  });
}
