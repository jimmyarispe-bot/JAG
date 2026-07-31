/**
 * QuickBooks sync → Evidence Catalog™ + Processing Pipeline™.
 */

import { randomUUID } from "node:crypto";
import { uploadEvidence } from "@/lib/evidence-center";
import { listJobsForOrganization } from "@/lib/evidence-center/pipeline";
import {
  ensureFreshQuickBooksTokens,
  getQuickBooksInstallation,
  updateQuickBooksSchedule,
} from "@/lib/connectors/quickbooks/connection";
import {
  mapQboReportToEvidenceDraft,
  reportFileName,
} from "@/lib/connectors/quickbooks/mapping";
import { fetchQuickBooksReports } from "@/lib/connectors/quickbooks/reports";
import { classifyThrownError, qboError } from "@/lib/connectors/quickbooks/errors";
import { QBO_CONNECTOR_ID, type QboReportType } from "@/lib/connectors/quickbooks/types";
import { createConnectorScheduler } from "@/lib/connectors/scheduler";
import { transitionConnectorStatus } from "@/lib/connectors/status";
import {
  appendSyncEvent,
  getSyncJob,
  listSyncEventsForJob,
  listSyncJobsForOrganization,
  upsertInstallation,
  upsertSyncJob,
} from "@/lib/connectors/store";
import type { ConnectorSyncJob } from "@/lib/connectors/types";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";
import { jagLogger } from "@/lib/jag-platform/logging";

export type QuickBooksSyncResult =
  | {
      ok: true;
      job: ConnectorSyncJob;
      evidenceIds: readonly string[];
      recordsImported: number;
    }
  | { ok: false; job: ConnectorSyncJob | null; error: string; code?: string };

function emit(
  organizationId: string,
  syncJobId: string,
  eventName: string,
  message: string
): void {
  appendSyncEvent({
    id: randomUUID(),
    organizationId,
    syncJobId,
    eventName,
    message,
    at: new Date().toISOString(),
  });
}

export async function runQuickBooksSync(input: {
  organizationId: string;
  organizationName: string;
  actorUserId: string;
  actorDisplayName: string;
  reportTypes?: readonly QboReportType[];
  /** Test seam */
  fetchReports?: typeof fetchQuickBooksReports;
}): Promise<QuickBooksSyncResult> {
  const installation = getQuickBooksInstallation(input.organizationId);
  if (!installation) {
    return {
      ok: false,
      job: null,
      error: "QuickBooks is not connected for this organization.",
      code: "not_connected",
    };
  }

  const startedAt = new Date().toISOString();
  const jobId = randomUUID();
  let job = upsertSyncJob({
    id: jobId,
    organizationId: input.organizationId,
    installationId: installation.id,
    connectorId: QBO_CONNECTOR_ID,
    status: "Running",
    startedAt,
    completedAt: null,
    lastError: null,
    recordsImported: 0,
    failureCount: 0,
    durationMs: null,
    createdAt: startedAt,
  });

  emit(input.organizationId, jobId, "Sync Started", "QuickBooks sync started.");

  {
    let from = installation.status;
    if (from === "Installed" || from === "Disconnected" || from === "Error") {
      from = transitionConnectorStatus(from, "Connected");
    }
    upsertInstallation({
      ...installation,
      status: transitionConnectorStatus(from, "Syncing"),
      health: "Warning",
      lastError: null,
      updatedAt: startedAt,
    });
  }

  try {
    const fresh = await ensureFreshQuickBooksTokens(input.organizationId);
    if (!fresh.ok) {
      const completedAt = new Date().toISOString();
      job = upsertSyncJob({
        ...job,
        status: "Failed",
        completedAt,
        lastError: fresh.error.message,
        failureCount: 1,
        durationMs: Date.parse(completedAt) - Date.parse(startedAt),
      });
      emit(input.organizationId, jobId, "Failures", fresh.error.message);
      upsertInstallation({
        ...getQuickBooksInstallation(input.organizationId)!,
        status:
          fresh.error.code === "revoked_authorization"
            ? "Disconnected"
            : "Error",
        health: "Error",
        lastError: fresh.error.message,
        updatedAt: completedAt,
      });
      return {
        ok: false,
        job,
        error: fresh.error.message,
        code: fresh.error.code,
      };
    }

    const fetchReports = input.fetchReports ?? fetchQuickBooksReports;
    const fetched = await fetchReports({ tokens: fresh.tokens, reportTypes: input.reportTypes });
    if (!fetched.ok) {
      const completedAt = new Date().toISOString();
      job = upsertSyncJob({
        ...job,
        status: "Failed",
        completedAt,
        lastError: fetched.error.message,
        failureCount: 1,
        durationMs: Date.parse(completedAt) - Date.parse(startedAt),
      });
      emit(input.organizationId, jobId, "Failures", fetched.error.message);
      upsertInstallation({
        ...getQuickBooksInstallation(input.organizationId)!,
        status: "Error",
        health: fetched.error.code === "rate_limited" ? "Warning" : "Error",
        lastError: fetched.error.message,
        updatedAt: completedAt,
      });
      return {
        ok: false,
        job,
        error: fetched.error.message,
        code: fetched.error.code,
      };
    }

    const evidenceIds: string[] = [];
    let failures = 0;
    for (const report of fetched.reports) {
      const draft = mapQboReportToEvidenceDraft(report);
      const body = JSON.stringify(report, null, 2);
      const result = uploadEvidence({
        organizationId: input.organizationId,
        organizationName: input.organizationName,
        fileName: reportFileName(report.reportType, report.periodLabel),
        mimeType: "text/plain",
        byteSize: Buffer.byteLength(body, "utf8"),
        name: draft.name,
        domain: draft.domain,
        evidenceType: draft.evidenceType,
        description: `Imported from QuickBooks Online (${report.reportType}). Ingestion only — no AI analysis.`,
        tags: ["quickbooks", report.reportType.toLowerCase(), "connector"],
        reportingPeriodKind: "Annual",
        reportingPeriodLabel: draft.reportingPeriodLabel,
        businessUnit: "Finance",
        source: "QuickBooks",
        confidentiality: "Confidential",
        owner: input.actorDisplayName,
        createdBy: input.actorUserId,
        createdByName: input.actorDisplayName,
      });
      if (!result.ok) {
        failures += 1;
        emit(
          input.organizationId,
          jobId,
          "Failures",
          `Failed to import ${report.reportName}: ${result.error}`
        );
        continue;
      }
      evidenceIds.push(result.document.id);
      emit(
        input.organizationId,
        jobId,
        "Record Imported",
        `${report.reportName} → evidence ${result.document.id}`
      );
    }

    const completedAt = new Date().toISOString();
    const durationMs = Date.parse(completedAt) - Date.parse(startedAt);
    const ok = failures === 0 && evidenceIds.length > 0;
    job = upsertSyncJob({
      ...job,
      status: ok ? "Completed" : evidenceIds.length > 0 ? "Completed" : "Failed",
      completedAt,
      lastError: failures > 0 ? `${failures} report(s) failed to import.` : null,
      recordsImported: evidenceIds.length,
      failureCount: failures,
      durationMs,
    });

    emit(
      input.organizationId,
      jobId,
      "Sync Completed",
      `Imported ${evidenceIds.length} report(s) in ${durationMs}ms.`
    );

    const current = getQuickBooksInstallation(input.organizationId)!;
    const plan = createConnectorScheduler().planNextRun({
      organizationId: input.organizationId,
      installationId: current.id,
      frequency: current.scheduleFrequency,
    });
    upsertInstallation({
      ...current,
      status: "Connected",
      health: failures > 0 ? "Warning" : "Healthy",
      lastSyncAt: completedAt,
      nextScheduledSyncAt: plan.nextRunAt,
      lastError: failures > 0 ? `${failures} report(s) failed to import.` : null,
      updatedAt: completedAt,
    });

    // Confirm pipeline jobs exist for imported evidence (reuse platform).
    const jobs = listJobsForOrganization(input.organizationId);
    for (const id of evidenceIds) {
      const pipelineJob = jobs.find((j) => j.evidenceId === id);
      if (!pipelineJob) {
        emit(
          input.organizationId,
          jobId,
          "Failures",
          `Missing processing job for evidence ${id}`
        );
      }
    }

    emitJagPlatformEvent({
      organizationId: input.organizationId,
      sourceModule: "quickbooks",
      entityType: "ConnectorSyncJob",
      entityId: jobId,
      eventType: evidenceIds.length > 0 ? "connector.sync.completed" : "connector.sync.failed",
      actor: input.actorUserId,
      metadata: {
        recordsImported: String(evidenceIds.length),
        failures: String(failures),
      },
    });
    jagLogger.information("quickbooks", "Sync finished", {
      organizationId: input.organizationId,
      metadata: {
        jobId,
        recordsImported: evidenceIds.length,
        failures,
      },
    });

    if (evidenceIds.length === 0) {
      return {
        ok: false,
        job,
        error: "No records imported",
      };
    }
    return {
      ok: true,
      job,
      evidenceIds,
      recordsImported: evidenceIds.length,
    };
  } catch (err) {
    const classified = classifyThrownError(err);
    const completedAt = new Date().toISOString();
    job = upsertSyncJob({
      ...job,
      status: "Failed",
      completedAt,
      lastError: classified.message,
      failureCount: 1,
      durationMs: Date.parse(completedAt) - Date.parse(startedAt),
    });
    emit(input.organizationId, jobId, "Failures", classified.message);
    const current = getQuickBooksInstallation(input.organizationId);
    if (current) {
      upsertInstallation({
        ...current,
        status: "Error",
        health: "Error",
        lastError: classified.message,
        updatedAt: completedAt,
      });
    }
    return {
      ok: false,
      job,
      error: classified.message,
      code: classified.code,
    };
  }
}

export async function retryQuickBooksSyncJob(input: {
  organizationId: string;
  organizationName: string;
  syncJobId: string;
  actorUserId: string;
  actorDisplayName: string;
}): Promise<QuickBooksSyncResult> {
  const prior = getSyncJob(input.organizationId, input.syncJobId);
  if (!prior || prior.connectorId !== QBO_CONNECTOR_ID) {
    return {
      ok: false,
      job: null,
      error: "Sync job not found.",
      code: "unknown",
    };
  }
  if (prior.status !== "Failed") {
    return {
      ok: false,
      job: prior,
      error: "Only failed sync jobs can be retried.",
      code: "unknown",
    };
  }
  emit(
    input.organizationId,
    prior.id,
    "Retry",
    "Retry requested — starting a new sync run."
  );
  return runQuickBooksSync({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    actorUserId: input.actorUserId,
    actorDisplayName: input.actorDisplayName,
  });
}

export function listQuickBooksSyncHistory(organizationId: string): {
  readonly jobs: readonly ConnectorSyncJob[];
  readonly eventsByJobId: Readonly<Record<string, ReturnType<typeof listSyncEventsForJob>>>;
} {
  const jobs = listSyncJobsForOrganization(organizationId).filter(
    (j) => j.connectorId === QBO_CONNECTOR_ID
  );
  const eventsByJobId: Record<string, ReturnType<typeof listSyncEventsForJob>> = {};
  for (const job of jobs) {
    eventsByJobId[job.id] = listSyncEventsForJob(organizationId, job.id);
  }
  return { jobs, eventsByJobId };
}

/** Run due scheduled QuickBooks syncs (Daily / Weekly). */
export async function runDueQuickBooksScheduledSyncs(input: {
  organizationNameFor: (organizationId: string) => string;
  actorUserId?: string;
  actorDisplayName?: string;
  now?: Date;
}): Promise<readonly QuickBooksSyncResult[]> {
  const now = input.now ?? new Date();
  const { listAllInstallations } = await import("@/lib/connectors/store");
  const due = listAllInstallations().filter((i) => {
    if (i.connectorId !== QBO_CONNECTOR_ID) return false;
    if (i.status !== "Connected" || !i.enabled) return false;
    if (i.scheduleFrequency === "Manual") return false;
    if (!i.nextScheduledSyncAt) return false;
    return Date.parse(i.nextScheduledSyncAt) <= now.getTime();
  });

  const results: QuickBooksSyncResult[] = [];
  for (const installation of due) {
    results.push(
      await runQuickBooksSync({
        organizationId: installation.organizationId,
        organizationName: input.organizationNameFor(installation.organizationId),
        actorUserId: input.actorUserId ?? "system-scheduler",
        actorDisplayName: input.actorDisplayName ?? "Connector Scheduler",
      })
    );
  }
  return results;
}

export { updateQuickBooksSchedule };
