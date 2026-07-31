/**
 * ConnectorScheduler™ — Manual/Hourly/Daily/Weekly/Monthly/Disabled + priorities.
 */

import { createConnectorScheduler } from "@/lib/connectors/scheduler";
import {
  listInstallationsForOrganization,
  upsertInstallation,
} from "@/lib/connectors/store";
import type { ScheduleFrequency } from "@/lib/connectors/types";
import { createConnectorAudit } from "@/lib/connectors/orchestrator/audit";
import {
  getPriority,
  listOrchestratorJobs,
  setPriority,
  upsertOrchestratorJob,
} from "@/lib/connectors/orchestrator/store";
import type {
  JobPriority,
  OrchestratorJob,
  OrchestratorSchedule,
} from "@/lib/connectors/orchestrator/types";
import { randomUUID } from "node:crypto";

function toFrameworkFrequency(
  schedule: OrchestratorSchedule
): ScheduleFrequency {
  if (schedule === "Disabled" || schedule === "Manual") return "Manual";
  return schedule;
}

export type ConnectorOrchestratorScheduler = {
  plan(input: {
    organizationId: string;
    connectorId: string;
    schedule: OrchestratorSchedule;
    actor: string;
  }): { readonly ok: boolean; readonly nextRunAt: string | null; readonly error?: string };
  setPriority(
    organizationId: string,
    connectorId: string,
    priority: JobPriority
  ): void;
  getPriority(organizationId: string, connectorId: string): JobPriority;
  enqueueDue(organizationId: string): readonly OrchestratorJob[];
  listQueue(organizationId: string): readonly OrchestratorJob[];
};

export function createOrchestratorScheduler(): ConnectorOrchestratorScheduler {
  const framework = createConnectorScheduler();
  const audit = createConnectorAudit();

  return {
    plan(input) {
      const installation = listInstallationsForOrganization(
        input.organizationId
      ).find((i) => i.connectorId === input.connectorId);
      if (!installation) {
        return { ok: false, nextRunAt: null, error: "Not installed." };
      }
      if (input.schedule === "Disabled") {
        upsertInstallation({
          ...installation,
          scheduleFrequency: "Manual",
          nextScheduledSyncAt: null,
          enabled: false,
          updatedAt: new Date().toISOString(),
        });
        audit.record({
          organizationId: input.organizationId,
          connectorId: input.connectorId,
          kind: "Scheduled",
          actor: input.actor,
          message: "Schedule Disabled.",
        });
        return { ok: true, nextRunAt: null };
      }
      const frequency = toFrameworkFrequency(input.schedule);
      const plan = framework.planNextRun({
        organizationId: input.organizationId,
        installationId: installation.id,
        frequency,
      });
      upsertInstallation({
        ...installation,
        scheduleFrequency: frequency,
        nextScheduledSyncAt: plan.nextRunAt,
        enabled: true,
        updatedAt: new Date().toISOString(),
      });
      audit.record({
        organizationId: input.organizationId,
        connectorId: input.connectorId,
        kind: "Scheduled",
        actor: input.actor,
        message: `Schedule set to ${input.schedule}.`,
        metadata: { nextRunAt: plan.nextRunAt ?? "" },
      });
      framework.enqueueScheduledSync(plan);
      return { ok: true, nextRunAt: plan.nextRunAt };
    },

    setPriority,
    getPriority,

    enqueueDue(organizationId) {
      const now = Date.now();
      const due = listInstallationsForOrganization(organizationId).filter(
        (i) =>
          i.enabled &&
          i.status === "Connected" &&
          i.scheduleFrequency !== "Manual" &&
          i.nextScheduledSyncAt != null &&
          Date.parse(i.nextScheduledSyncAt) <= now
      );
      const jobs: OrchestratorJob[] = [];
      for (const installation of due) {
        const job: OrchestratorJob = {
          id: randomUUID(),
          organizationId,
          connectorId: installation.connectorId,
          installationId: installation.id,
          priority: getPriority(organizationId, installation.connectorId),
          status: "Queued",
          attempt: 0,
          maxAttempts: 3,
          createdAt: new Date().toISOString(),
          startedAt: null,
          completedAt: null,
          lastError: null,
          recordsImported: 0,
          durationMs: null,
        };
        upsertOrchestratorJob(job);
        jobs.push(job);
      }
      const priorityRank = { High: 0, Normal: 1, Low: 2 } as const;
      return Object.freeze(
        jobs.sort(
          (a, b) =>
            priorityRank[a.priority] - priorityRank[b.priority] ||
            a.createdAt.localeCompare(b.createdAt)
        )
      );
    },

    listQueue(organizationId) {
      return Object.freeze(
        listOrchestratorJobs(organizationId).filter(
          (j) =>
            j.status === "Queued" ||
            j.status === "Running" ||
            j.status === "Retrying"
        )
      );
    },
  };
}
