/**
 * Connector Scheduler Interface — no actual scheduling this sprint.
 */

import type { ScheduleFrequency } from "@/lib/connectors/types";

export type SchedulePlan = {
  readonly installationId: string;
  readonly organizationId: string;
  readonly frequency: ScheduleFrequency;
  readonly nextRunAt: string | null;
};

export interface ConnectorSchedulerInterface {
  planNextRun(input: {
    readonly organizationId: string;
    readonly installationId: string;
    readonly frequency: ScheduleFrequency;
    readonly from?: Date;
  }): SchedulePlan;

  /** Future: enqueue sync. Framework sprint — no-op. */
  enqueueScheduledSync(plan: SchedulePlan): void;
}

export function createConnectorScheduler(): ConnectorSchedulerInterface {
  return {
    planNextRun({ organizationId, installationId, frequency, from }) {
      const base = from ?? new Date();
      let next: Date | null = null;
      if (frequency !== "Manual") {
        next = new Date(base);
        switch (frequency) {
          case "Hourly":
            next.setHours(next.getHours() + 1);
            break;
          case "Daily":
            next.setDate(next.getDate() + 1);
            break;
          case "Weekly":
            next.setDate(next.getDate() + 7);
            break;
          case "Monthly":
            next.setMonth(next.getMonth() + 1);
            break;
          default:
            next = null;
        }
      }
      return {
        organizationId,
        installationId,
        frequency,
        nextRunAt: next ? next.toISOString() : null,
      };
    },
    enqueueScheduledSync() {
      // Intentionally empty — no scheduler runtime this sprint.
    },
  };
}
