import { randomUUID } from "node:crypto";
import {
  addBusinessUnitForOrganization,
  getEvidenceDocument,
  listBusinessUnitsForOrganization,
  listEvidenceForOrganization,
  listRelationshipsForDocument,
  listVersionsForDocument,
  saveEvidenceDocument,
  saveEvidenceRelationship,
  saveEvidenceVersion,
  updateEvidenceDocument,
} from "@/lib/evidence-center/store";
import type {
  CatalogDashboardSummary,
  ConfidentialityLevel,
  EvidenceDocument,
  EvidenceRelationship,
  EvidenceSearchFilters,
  EvidenceSource,
  EvidenceStatus,
  EvidenceTimelineEvent,
  EvidenceVersion,
  RelationshipType,
  ReportingPeriodKind,
  UploadEvidenceInput,
} from "@/lib/evidence-center/types";
import {
  validateRelationshipType,
  validateUploadEvidence,
} from "@/lib/evidence-center/validate";
import { createAndRunProcessingJob } from "@/lib/evidence-center/pipeline/service";
import {
  syncEvidenceDocumentToGraph,
  syncEvidenceRelationshipToGraph,
} from "@/lib/evidence-center/knowledge-graph";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";
import { jagLogger } from "@/lib/jag-platform/logging";

export type UploadEvidenceResult =
  | { readonly ok: true; readonly document: EvidenceDocument }
  | {
      readonly ok: false;
      readonly error: string;
      readonly fieldErrors?: Record<string, string>;
    };

function slugName(fileName: string): string {
  return fileName.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

function timelineEvent(
  kind: EvidenceTimelineEvent["kind"],
  label: string,
  actorName?: string
): EvidenceTimelineEvent {
  return {
    id: randomUUID(),
    kind,
    at: new Date().toISOString(),
    label,
    actorName,
  };
}

/**
 * @deprecated Prefer createAndRunProcessingJob via uploadEvidence.
 * Kept for tests that force status without the full pipeline.
 */
export function simulateEvidenceProcessing(documentId: string): void {
  updateEvidenceDocument(documentId, { status: "processing" });
  queueMicrotask(() => {
    const doc = getEvidenceDocument(documentId);
    if (!doc || doc.status !== "processing") return;
    updateEvidenceDocument(documentId, { status: "completed" });
  });
}

export function uploadEvidence(
  input: Partial<UploadEvidenceInput>
): UploadEvidenceResult {
  const units = input.organizationId
    ? listBusinessUnitsForOrganization(input.organizationId)
    : undefined;
  const validation = validateUploadEvidence(input, { businessUnits: units });
  if (!validation.ok) {
    return {
      ok: false,
      error: validation.error,
      fieldErrors: validation.fieldErrors,
    };
  }

  const data = validation.data;
  if (
    data.businessUnit &&
    !units?.some((u) => u.toLowerCase() === data.businessUnit!.toLowerCase())
  ) {
    addBusinessUnitForOrganization(data.organizationId, data.businessUnit);
  }

  const id = randomUUID();
  const versionId = randomUUID();
  const now = new Date().toISOString();
  const storagePath = `evidence-documents/${data.organizationId}/${id}/v1/${slugName(data.fileName)}`;

  const created = timelineEvent("created", "Evidence record created", data.createdByName);
  const uploaded = timelineEvent(
    "uploaded",
    `Uploaded ${data.fileName}`,
    data.createdByName
  );
  const versionAdded = timelineEvent(
    "version_added",
    "Version 1 added",
    data.createdByName
  );

  const document: EvidenceDocument = {
    id,
    organizationId: data.organizationId,
    organizationName: data.organizationName,
    name: data.name ?? data.fileName,
    storagePath,
    domain: data.domain as EvidenceDocument["domain"],
    evidenceType: data.evidenceType as EvidenceDocument["evidenceType"],
    description: data.description ?? "",
    tags: Object.freeze([...(data.tags ?? [])]),
    reportingPeriodKind: (data.reportingPeriodKind ??
      "Custom") as ReportingPeriodKind,
    reportingPeriodLabel: data.reportingPeriodLabel ?? "",
    businessUnit: data.businessUnit ?? "Corporate",
    department: data.department ?? "",
    location: data.location ?? "",
    owner: data.owner ?? data.createdByName,
    source: (data.source ?? "Uploaded") as EvidenceSource,
    confidentiality: (data.confidentiality ??
      "Internal") as ConfidentialityLevel,
    currentVersion: 1,
    status: "queued",
    createdBy: data.createdBy,
    createdByName: data.createdByName,
    fileName: data.fileName,
    mimeType: data.mimeType ?? "application/octet-stream",
    byteSize: data.byteSize ?? 0,
    createdAt: now,
    updatedAt: now,
    timeline: Object.freeze([created, uploaded, versionAdded]),
  };

  const version: EvidenceVersion = {
    id: versionId,
    documentId: id,
    organizationId: data.organizationId,
    versionNumber: 1,
    fileName: data.fileName,
    storagePath,
    mimeType: document.mimeType,
    byteSize: document.byteSize,
    isLatest: true,
    superseded: false,
    createdBy: data.createdBy,
    createdByName: data.createdByName,
    createdAt: now,
    notes: "Initial version",
  };

  saveEvidenceDocument(document);
  saveEvidenceVersion(version);
  syncEvidenceDocumentToGraph(document);
  createAndRunProcessingJob({
    evidenceId: id,
    organizationId: data.organizationId,
  });
  emitJagPlatformEvent({
    organizationId: data.organizationId,
    sourceModule: "evidence",
    entityType: "EvidenceDocument",
    entityId: id,
    eventType: "evidence.created",
    actor: data.createdBy,
    metadata: {
      source: document.source,
      domain: document.domain,
    },
  });
  jagLogger.audit("evidence", "Evidence created", {
    organizationId: data.organizationId,
    metadata: { evidenceId: id, source: document.source },
  });
  return { ok: true, document: getEvidenceDocument(id) ?? document };
}

export function addEvidenceVersion(input: {
  readonly organizationId: string;
  readonly documentId: string;
  readonly fileName: string;
  readonly mimeType?: string;
  readonly byteSize?: number;
  readonly createdBy: string;
  readonly createdByName: string;
  readonly notes?: string;
}):
  | { readonly ok: true; readonly document: EvidenceDocument; readonly version: EvidenceVersion }
  | { readonly ok: false; readonly error: string } {
  const doc = getEvidenceForOrganization(input.organizationId, input.documentId);
  if (!doc) {
    return { ok: false, error: "Evidence not found." };
  }
  if (!input.fileName.trim()) {
    return { ok: false, error: "A file is required for the new version." };
  }

  const nextNumber = doc.currentVersion + 1;
  const now = new Date().toISOString();
  const storagePath = `evidence-documents/${doc.organizationId}/${doc.id}/v${nextNumber}/${slugName(input.fileName)}`;

  for (const existing of listVersionsForDocument(
    input.organizationId,
    input.documentId
  )) {
    if (existing.isLatest) {
      saveEvidenceVersion({
        ...existing,
        isLatest: false,
        superseded: true,
      });
    }
  }

  const version: EvidenceVersion = {
    id: randomUUID(),
    documentId: doc.id,
    organizationId: doc.organizationId,
    versionNumber: nextNumber,
    fileName: input.fileName.trim(),
    storagePath,
    mimeType: input.mimeType ?? "application/octet-stream",
    byteSize: input.byteSize ?? 0,
    isLatest: true,
    superseded: false,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    createdAt: now,
    notes: (input.notes ?? "").trim(),
  };

  saveEvidenceVersion(version);

  const timeline = [
    ...doc.timeline,
    timelineEvent(
      "version_added",
      `Version ${nextNumber} added`,
      input.createdByName
    ),
  ];

  const updated = updateEvidenceDocument(doc.id, {
    currentVersion: nextNumber,
    fileName: version.fileName,
    storagePath: version.storagePath,
    mimeType: version.mimeType,
    byteSize: version.byteSize,
    status: "awaiting_review",
    timeline: Object.freeze(timeline),
  });

  if (updated) {
    syncEvidenceDocumentToGraph(updated);
  }

  return {
    ok: true,
    document: updated!,
    version,
  };
}

export function createEvidenceRelationship(input: {
  readonly organizationId: string;
  readonly fromDocumentId: string;
  readonly toDocumentId: string;
  readonly relationshipType: string;
  readonly createdBy: string;
}):
  | { readonly ok: true; readonly relationship: EvidenceRelationship }
  | { readonly ok: false; readonly error: string } {
  const type = validateRelationshipType(input.relationshipType);
  if (!type) {
    return { ok: false, error: "Invalid relationship type." };
  }
  if (input.fromDocumentId === input.toDocumentId) {
    return { ok: false, error: "Evidence cannot relate to itself." };
  }
  const from = getEvidenceForOrganization(
    input.organizationId,
    input.fromDocumentId
  );
  const to = getEvidenceForOrganization(
    input.organizationId,
    input.toDocumentId
  );
  if (!from || !to) {
    return {
      ok: false,
      error: "Both evidence records must exist in the same organization.",
    };
  }

  const relationship: EvidenceRelationship = {
    id: randomUUID(),
    organizationId: input.organizationId,
    fromDocumentId: input.fromDocumentId,
    toDocumentId: input.toDocumentId,
    relationshipType: type,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  saveEvidenceRelationship(relationship);
  syncEvidenceRelationshipToGraph(relationship);

  const fromTimeline = [
    ...from.timeline,
    timelineEvent(
      "metadata_updated",
      `${type} → ${to.name}`,
      input.createdBy
    ),
  ];
  updateEvidenceDocument(from.id, {
    timeline: Object.freeze(fromTimeline),
  });

  return { ok: true, relationship };
}

export function searchEvidence(
  filters: EvidenceSearchFilters
): readonly EvidenceDocument[] {
  const q = (filters.query ?? "").trim().toLowerCase();
  return listEvidenceForOrganization(filters.organizationId).filter((doc) => {
    if (filters.domain && doc.domain !== filters.domain) return false;
    if (filters.evidenceType && doc.evidenceType !== filters.evidenceType) {
      return false;
    }
    if (filters.status && doc.status !== filters.status) return false;
    if (
      filters.tag &&
      !doc.tags.some((t) => t.toLowerCase() === filters.tag!.toLowerCase())
    ) {
      return false;
    }
    if (
      filters.reportingPeriod &&
      doc.reportingPeriodLabel.toLowerCase() !==
        filters.reportingPeriod.toLowerCase()
    ) {
      return false;
    }
    if (
      filters.businessUnit &&
      doc.businessUnit.toLowerCase() !== filters.businessUnit.toLowerCase()
    ) {
      return false;
    }
    if (
      filters.department &&
      doc.department.toLowerCase() !== filters.department.toLowerCase()
    ) {
      return false;
    }
    if (
      filters.confidentiality &&
      doc.confidentiality !== filters.confidentiality
    ) {
      return false;
    }
    if (
      filters.owner &&
      doc.owner.toLowerCase() !== filters.owner.toLowerCase()
    ) {
      return false;
    }
    if (filters.source && doc.source !== filters.source) return false;
    if (!q) return true;
    const haystack = [
      doc.name,
      doc.fileName,
      doc.domain,
      doc.evidenceType,
      doc.reportingPeriodLabel,
      doc.businessUnit,
      doc.department,
      doc.owner,
      doc.source,
      doc.confidentiality,
      ...doc.tags,
      doc.description,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function getEvidenceForOrganization(
  organizationId: string,
  documentId: string
): EvidenceDocument | undefined {
  const doc = getEvidenceDocument(documentId);
  if (!doc || doc.organizationId !== organizationId) return undefined;
  return doc;
}

export function getVersionsForOrganization(
  organizationId: string,
  documentId: string
): readonly EvidenceVersion[] {
  if (!getEvidenceForOrganization(organizationId, documentId)) return [];
  return listVersionsForDocument(organizationId, documentId);
}

export function getRelationshipsForOrganization(
  organizationId: string,
  documentId: string
): readonly EvidenceRelationship[] {
  if (!getEvidenceForOrganization(organizationId, documentId)) return [];
  return listRelationshipsForDocument(organizationId, documentId);
}

export function queueSummary(
  organizationId: string
): Record<EvidenceStatus, number> {
  const counts: Record<EvidenceStatus, number> = {
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    awaiting_review: 0,
  };
  for (const doc of listEvidenceForOrganization(organizationId)) {
    counts[doc.status] += 1;
  }
  return counts;
}

export function catalogDashboardSummary(
  organizationId: string
): CatalogDashboardSummary {
  const docs = listEvidenceForOrganization(organizationId);
  const byDomain: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byReportingPeriod: Record<string, number> = {};

  for (const doc of docs) {
    byDomain[doc.domain] = (byDomain[doc.domain] ?? 0) + 1;
    byType[doc.evidenceType] = (byType[doc.evidenceType] ?? 0) + 1;
    const period = doc.reportingPeriodLabel || "Unspecified";
    byReportingPeriod[period] = (byReportingPeriod[period] ?? 0) + 1;
  }

  return {
    byDomain,
    byType,
    byReportingPeriod,
    recentUploads: docs.slice(0, 5),
    awaitingReview: docs.filter((d) => d.status === "awaiting_review").length,
    latestVersionCount: docs.filter((d) => d.currentVersion >= 1).length,
  };
}

export function setEvidenceStatusForTests(
  documentId: string,
  status: EvidenceStatus
): void {
  updateEvidenceDocument(documentId, { status });
}

export type { RelationshipType };
