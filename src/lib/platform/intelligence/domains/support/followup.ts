/**
 * Support Intelligence — follow-up scheduler.
 *
 * Schedules verification follow-ups (default: 7 days after resolution planning).
 * Tenant-agnostic; does not persist or call external calendars.
 */

import type {
  SupportFollowup,
  SupportResolutionPlan,
} from "@/lib/platform/intelligence/domains/support/types";
import { SUPPORT_FOLLOWUP_DAYS } from "@/lib/platform/intelligence/domains/support/types";

/** Options for follow-up scheduling. */
export interface SupportFollowupOptions {
  /** Override default verification window in days (must be positive). */
  daysUntilVerification?: number;
}

/**
 * Schedules post-resolution verification follow-ups.
 */
export class SupportFollowupService {
  private readonly daysUntilVerification: number;

  /**
   * @param options - Follow-up timing options (tenant-agnostic).
   */
  constructor(options: SupportFollowupOptions = {}) {
    const days = options.daysUntilVerification ?? SUPPORT_FOLLOWUP_DAYS;
    this.daysUntilVerification = days > 0 ? days : SUPPORT_FOLLOWUP_DAYS;
  }

  /**
   * Schedule a verification follow-up for a resolution plan.
   * Default due date is 7 days from scheduling time.
   * @param plan - Guided resolution plan to verify later.
   * @returns Scheduled follow-up descriptor (not persisted).
   */
  schedule(plan: SupportResolutionPlan): SupportFollowup {
    const scheduledAt = new Date();
    const dueAt = new Date(scheduledAt);
    dueAt.setUTCDate(dueAt.getUTCDate() + this.daysUntilVerification);

    return {
      followupId: `${plan.requestId}:followup`,
      requestId: plan.requestId,
      planId: plan.planId,
      status: "scheduled",
      dueAt: dueAt.toISOString(),
      scheduledAt: scheduledAt.toISOString(),
      verificationChecklist: this.buildChecklist(plan),
      metadata: {
        daysUntilVerification: this.daysUntilVerification,
        category: plan.classification.category,
      },
    };
  }

  /**
   * Build a reusable verification checklist from the resolution plan.
   * @param plan - Plan whose steps and hypothesis inform verification.
   */
  buildChecklist(plan: SupportResolutionPlan): string[] {
    const checklist: string[] = [
      "Confirm the original symptom no longer occurs",
      "Confirm the user can complete the intended action",
      "Confirm no new related errors were reported",
    ];

    if (plan.primaryHypothesis) {
      checklist.push(`Re-check primary hypothesis: ${plan.primaryHypothesis.label}`);
    }

    for (const step of plan.steps.slice(0, 3)) {
      checklist.push(`Verify outcome of step: ${step.label}`);
    }

    return checklist;
  }
}
