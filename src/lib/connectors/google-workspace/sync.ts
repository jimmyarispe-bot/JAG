/**
 * Google Workspace sync → Drive evidence + placeholder KG nodes.
 */

import { randomUUID } from "node:crypto";
import { uploadEvidence } from "@/lib/evidence-center";
import {
  ensureFreshGoogleWorkspaceTokens,
  getGoogleWorkspaceInstallation,
} from "@/lib/connectors/google-workspace/connection";
import { fetchGoogleWorkspaceMetadata } from "@/lib/connectors/google-workspace/client";
import {
  registerCalendarEventNode,
  registerContactPersonNode,
  registerGmailCommunicationNode,
} from "@/lib/connectors/google-workspace/graph";
import {
  driveEvidenceFileName,
  driveFileBecomesEvidence,
  mapDriveFileToEvidenceDraft,
} from "@/lib/connectors/google-workspace/mapping";
import { GWS_CONNECTOR_ID } from "@/lib/connectors/google-workspace/types";
import { createConnectorScheduler } from "@/lib/connectors/scheduler";
import { transitionConnectorStatus } from "@/lib/connectors/status";
import {
  appendSyncEvent,
  listSyncEventsForJob,
  listSyncJobsForOrganization,
  upsertInstallation,
  upsertSyncJob,
} from "@/lib/connectors/store";
import type { ConnectorSyncJob } from "@/lib/connectors/types";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";
import { jagLogger } from "@/lib/jag-platform/logging";

export type GoogleWorkspaceSyncResult =
  | {
      ok: true;
      job: ConnectorSyncJob;
      evidenceIds: readonly string[];
      recordsImported: number;
      calendarEvents: number;
      messages: number;
      contacts: number;
    }
  | { ok: false; job: ConnectorSyncJob | null; error: string };

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

export async function runGoogleWorkspaceSync(input: {
  organizationId: string;
  organizationName: string;
  actorUserId: string;
  actorDisplayName: string;
  fetchMetadata?: typeof fetchGoogleWorkspaceMetadata;
}): Promise<GoogleWorkspaceSyncResult> {
  const installation = getGoogleWorkspaceInstallation(input.organizationId);
  if (!installation) {
    return {
      ok: false,
      job: null,
      error: "Google Workspace is not connected for this organization.",
    };
  }

  const startedAt = new Date().toISOString();
  const jobId = randomUUID();
  let job = upsertSyncJob({
    id: jobId,
    organizationId: input.organizationId,
    installationId: installation.id,
    connectorId: GWS_CONNECTOR_ID,
    status: "Running",
    startedAt,
    completedAt: null,
    lastError: null,
    recordsImported: 0,
    failureCount: 0,
    durationMs: null,
    createdAt: startedAt,
  });

  emit(input.organizationId, jobId, "Sync Started", "Google Workspace sync started.");

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
    const fresh = await ensureFreshGoogleWorkspaceTokens(input.organizationId);
    if (!fresh.ok) {
      const completedAt = new Date().toISOString();
      job = upsertSyncJob({
        ...job,
        status: "Failed",
        completedAt,
        lastError: fresh.error,
        failureCount: 1,
        durationMs: Date.parse(completedAt) - Date.parse(startedAt),
      });
      emit(input.organizationId, jobId, "Failures", fresh.error);
      upsertInstallation({
        ...getGoogleWorkspaceInstallation(input.organizationId)!,
        status: "Error",
        health: "Error",
        lastError: fresh.error,
        updatedAt: completedAt,
      });
      return { ok: false, job, error: fresh.error };
    }

    const fetchMeta = input.fetchMetadata ?? fetchGoogleWorkspaceMetadata;
    const fetched = await fetchMeta({ tokens: fresh.tokens });
    if (!fetched.ok) {
      const completedAt = new Date().toISOString();
      job = upsertSyncJob({
        ...job,
        status: "Failed",
        completedAt,
        lastError: fetched.error,
        failureCount: 1,
        durationMs: Date.parse(completedAt) - Date.parse(startedAt),
      });
      emit(input.organizationId, jobId, "Failures", fetched.error);
      upsertInstallation({
        ...getGoogleWorkspaceInstallation(input.organizationId)!,
        status: "Error",
        health: "Error",
        lastError: fetched.error,
        updatedAt: completedAt,
      });
      return { ok: false, job, error: fetched.error };
    }

    const evidenceIds: string[] = [];
    let failures = 0;

    for (const file of fetched.bundle.drive) {
      if (!driveFileBecomesEvidence(file)) {
        emit(
          input.organizationId,
          jobId,
          "Drive Folder Skipped",
          `Folder metadata recorded without evidence: ${file.name}`
        );
        continue;
      }
      const draft = mapDriveFileToEvidenceDraft(file);
      const body = JSON.stringify(
        {
          note: "Drive metadata only — content not downloaded or parsed.",
          file,
        },
        null,
        2
      );
      const result = uploadEvidence({
        organizationId: input.organizationId,
        organizationName: input.organizationName,
        fileName: driveEvidenceFileName(file),
        mimeType: "text/plain",
        byteSize: Buffer.byteLength(body, "utf8"),
        name: draft.name,
        domain: draft.domain,
        evidenceType: draft.evidenceType,
        description:
          "Imported from Google Drive (metadata only). No document content or AI analysis.",
        tags: ["google-workspace", "drive", file.kind],
        reportingPeriodKind: "Custom",
        reportingPeriodLabel: "Workspace Sync",
        businessUnit: "Corporate",
        source: "Google Workspace",
        confidentiality: "Internal",
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
          `Drive import failed for ${file.name}: ${result.error}`
        );
        continue;
      }
      evidenceIds.push(result.document.id);
      emit(
        input.organizationId,
        jobId,
        "Record Imported",
        `Drive ${file.name} → evidence ${result.document.id}`
      );
    }

    for (const event of fetched.bundle.events) {
      registerCalendarEventNode(input.organizationId, event);
    }
    emit(
      input.organizationId,
      jobId,
      "Calendar Sync",
      `${fetched.bundle.events.length} event(s), ${fetched.bundle.calendars.length} calendar(s)`
    );

    for (const message of fetched.bundle.messages) {
      registerGmailCommunicationNode(input.organizationId, message);
    }
    emit(
      input.organizationId,
      jobId,
      "Gmail Metadata Sync",
      `${fetched.bundle.messages.length} message(s) (headers only)`
    );

    for (const contact of fetched.bundle.contacts) {
      registerContactPersonNode(input.organizationId, contact);
    }
    emit(
      input.organizationId,
      jobId,
      "Contacts Sync",
      `${fetched.bundle.contacts.length} contact(s)`
    );

    const completedAt = new Date().toISOString();
    const durationMs = Date.parse(completedAt) - Date.parse(startedAt);
    job = upsertSyncJob({
      ...job,
      status: evidenceIds.length > 0 || failures === 0 ? "Completed" : "Failed",
      completedAt,
      lastError: failures > 0 ? `${failures} Drive file(s) failed.` : null,
      recordsImported: evidenceIds.length,
      failureCount: failures,
      durationMs,
    });

    emit(
      input.organizationId,
      jobId,
      "Sync Completed",
      `Imported ${evidenceIds.length} Drive evidence record(s) in ${durationMs}ms.`
    );

    const current = getGoogleWorkspaceInstallation(input.organizationId)!;
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
      lastError: failures > 0 ? `${failures} Drive file(s) failed.` : null,
      updatedAt: completedAt,
    });

    emitJagPlatformEvent({
      organizationId: input.organizationId,
      sourceModule: "connectors",
      entityType: "ConnectorSyncJob",
      entityId: jobId,
      eventType: "connector.sync.completed",
      actor: input.actorUserId,
      metadata: {
        connectorId: GWS_CONNECTOR_ID,
        recordsImported: String(evidenceIds.length),
      },
    });
    jagLogger.information("google-workspace", "Sync finished", {
      organizationId: input.organizationId,
      metadata: { jobId, recordsImported: evidenceIds.length, failures },
    });

    return {
      ok: true,
      job,
      evidenceIds,
      recordsImported: evidenceIds.length,
      calendarEvents: fetched.bundle.events.length,
      messages: fetched.bundle.messages.length,
      contacts: fetched.bundle.contacts.length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown sync error.";
    const completedAt = new Date().toISOString();
    job = upsertSyncJob({
      ...job,
      status: "Failed",
      completedAt,
      lastError: message,
      failureCount: 1,
      durationMs: Date.parse(completedAt) - Date.parse(startedAt),
    });
    emit(input.organizationId, jobId, "Failures", message);
    const current = getGoogleWorkspaceInstallation(input.organizationId);
    if (current) {
      upsertInstallation({
        ...current,
        status: "Error",
        health: "Error",
        lastError: message,
        updatedAt: completedAt,
      });
    }
    return { ok: false, job, error: message };
  }
}

export function listGoogleWorkspaceSyncHistory(organizationId: string) {
  const jobs = listSyncJobsForOrganization(organizationId).filter(
    (j) => j.connectorId === GWS_CONNECTOR_ID
  );
  const eventsByJobId: Record<string, ReturnType<typeof listSyncEventsForJob>> =
    {};
  for (const job of jobs) {
    eventsByJobId[job.id] = listSyncEventsForJob(organizationId, job.id);
  }
  return { jobs, eventsByJobId };
}
