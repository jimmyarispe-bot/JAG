/**
 * Phase 2 — JAG Evidence single-document upload orchestration.
 * Authorization is enforced by callers (session + org). This module never trusts
 * client-supplied organization paths or IDs for path construction beyond the
 * already-authorized organizationId argument.
 */

import { randomUUID } from "node:crypto";
import {
  assertJagEvidencePathForOrganization,
  buildJagEvidenceObjectPath,
  createJagEvidenceSignedDownloadUrl,
  createJagEvidenceSignedUploadUrl,
  JAG_EVIDENCE_DOCUMENTS_BUCKET,
  removeJagEvidenceStorageObject,
  type JagEvidenceSignedUrlClient,
} from "@/lib/evidence-center/storage";
import { validateJagEvidenceFileInput } from "@/lib/evidence-center/validate-file";
import {
  deleteDurableEvidenceDocumentRow,
  deleteDurableEvidenceVersions,
  getDurableDocument,
  getDurableVersion,
  insertDurableDocument,
  insertDurableVersion,
  listDurableVersionsForDocument,
  updateDurableUploadLifecycle,
  verifyDurableStorageObject,
  type DurableEvidenceClient,
} from "@/lib/evidence-center/durable-repository";
import type {
  ConfidentialityLevel,
  EvidenceDomain,
  EvidenceSource,
  EvidenceType,
  ReportingPeriodKind,
} from "@/lib/evidence-center/types";
import {
  CONFIDENTIALITY_LEVELS,
  EVIDENCE_DOMAINS,
  EVIDENCE_SOURCES,
  EVIDENCE_TYPES,
  REPORTING_PERIOD_KINDS,
} from "@/lib/evidence-center/types";

export type AuthorizeEvidenceUploadInput = {
  readonly mode: "create" | "version";
  readonly organizationId: string;
  readonly organizationName: string;
  readonly actorUserId: string;
  readonly actorDisplayName: string;
  readonly filename: string;
  readonly mimeType?: string | null;
  readonly byteSize: number;
  readonly documentId?: string;
  readonly name?: string;
  readonly domain?: string;
  readonly evidenceType?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly reportingPeriodKind?: string;
  readonly reportingPeriodLabel?: string;
  readonly businessUnit?: string;
  readonly department?: string;
  readonly location?: string;
  readonly owner?: string;
  readonly source?: string;
  readonly confidentiality?: string;
};

export type AuthorizeEvidenceUploadResult =
  | {
      readonly ok: true;
      readonly documentId: string;
      readonly versionId: string;
      readonly versionNumber: number;
      readonly path: string;
      readonly bucket: typeof JAG_EVIDENCE_DOCUMENTS_BUCKET;
      readonly signedUrl: string;
      readonly token?: string;
      readonly mimeType: string;
      readonly byteSize: number;
      readonly safeFilename: string;
    }
  | { readonly ok: false; readonly error: string; readonly status?: number };

export type CompleteEvidenceUploadInput = {
  readonly organizationId: string;
  readonly documentId: string;
  readonly versionId: string;
};

export type CompleteEvidenceUploadResult =
  | {
      readonly ok: true;
      readonly documentId: string;
      readonly versionId: string;
      readonly lifecycleStatus: "AVAILABLE";
    }
  | { readonly ok: false; readonly error: string; readonly status?: number };

function pickEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T
): T {
  if (value && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}

export async function authorizeEvidenceUpload(
  deps: {
    db: DurableEvidenceClient;
    storage: JagEvidenceSignedUrlClient;
  },
  input: AuthorizeEvidenceUploadInput
): Promise<AuthorizeEvidenceUploadResult> {
  const file = validateJagEvidenceFileInput({
    filename: input.filename,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
  });
  if (!file.ok) return { ok: false, error: file.error, status: 400 };

  const organizationId = input.organizationId.trim();
  if (!organizationId) {
    return { ok: false, error: "Organization is required.", status: 400 };
  }

  const documentId =
    input.mode === "version"
      ? String(input.documentId ?? "").trim()
      : randomUUID();
  const versionId = randomUUID();

  let versionNumber = 1;
  if (input.mode === "version") {
    if (!documentId) {
      return { ok: false, error: "documentId is required for version upload.", status: 400 };
    }
    const existing = await getDurableDocument(deps.db, organizationId, documentId);
    if (!existing) {
      return { ok: false, error: "Document not found.", status: 404 };
    }
    const versions = await listDurableVersionsForDocument(
      deps.db,
      organizationId,
      documentId
    );
    versionNumber =
      (versions.reduce((max, v) => Math.max(max, v.version_number), 0) || 0) + 1;
  }

  const path = buildJagEvidenceObjectPath({
    organizationId,
    documentId,
    versionId,
    filename: file.safeFilename,
  });
  assertJagEvidencePathForOrganization(organizationId, path);

  if (input.mode === "create") {
    const name =
      (input.name ?? "").trim() ||
      file.originalFilename.replace(/\.[^.]+$/, "") ||
      file.safeFilename;
    const inserted = await insertDurableDocument(deps.db, {
      id: documentId,
      organization_id: organizationId,
      name,
      original_filename: file.originalFilename,
      mime_type: file.mimeType,
      byte_size: file.byteSize,
      storage_path: path,
      created_by: input.actorUserId,
      lifecycle_status: "UPLOADING",
      current_version: 1,
      domain: pickEnum(input.domain, EVIDENCE_DOMAINS, "General"),
      evidence_type: pickEnum(input.evidenceType, EVIDENCE_TYPES, "Other"),
      description: input.description ?? "",
      tags: [...(input.tags ?? [])],
      reporting_period_kind: pickEnum(
        input.reportingPeriodKind,
        REPORTING_PERIOD_KINDS,
        "Custom"
      ),
      reporting_period_label: (input.reportingPeriodLabel ?? "").trim() || "Unspecified",
      business_unit: (input.businessUnit ?? "").trim() || "Corporate",
      department: input.department ?? "",
      location: input.location ?? "",
      owner: (input.owner ?? "").trim() || input.actorDisplayName,
      source: pickEnum(input.source, EVIDENCE_SOURCES, "Uploaded"),
      confidentiality: pickEnum(
        input.confidentiality,
        CONFIDENTIALITY_LEVELS,
        "Internal"
      ),
    });
    if (!inserted.ok) return { ok: false, error: inserted.error, status: 500 };
  } else {
    await deps.db
      .from("jag_evidence_documents")
      .update({
        lifecycle_status: "UPLOADING",
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("organization_id", organizationId);
  }

  const versionInsert = await insertDurableVersion(deps.db, {
    id: versionId,
    document_id: documentId,
    organization_id: organizationId,
    version_number: versionNumber,
    storage_path: path,
    original_filename: file.originalFilename,
    mime_type: file.mimeType,
    byte_size: file.byteSize,
    uploaded_by: input.actorUserId,
    status: "UPLOADING",
  });
  if (!versionInsert.ok) {
    return { ok: false, error: versionInsert.error, status: 500 };
  }

  try {
    const signed = await createJagEvidenceSignedUploadUrl({
      client: deps.storage,
      organizationId,
      documentId,
      versionId,
      filename: file.safeFilename,
    });
    return {
      ok: true,
      documentId,
      versionId,
      versionNumber,
      path: signed.path,
      bucket: JAG_EVIDENCE_DOCUMENTS_BUCKET,
      signedUrl: signed.signedUrl,
      token: signed.token,
      mimeType: file.mimeType,
      byteSize: file.byteSize,
      safeFilename: file.safeFilename,
    };
  } catch (err) {
    await updateDurableUploadLifecycle(deps.db, {
      organizationId,
      documentId,
      versionId,
      documentLifecycle: "FAILED",
      versionStatus: "FAILED",
    });
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to mint upload URL",
      status: 500,
    };
  }
}

export async function completeEvidenceUpload(
  deps: { db: DurableEvidenceClient },
  input: CompleteEvidenceUploadInput
): Promise<CompleteEvidenceUploadResult> {
  const organizationId = input.organizationId.trim();
  const documentId = input.documentId.trim();
  const versionId = input.versionId.trim();
  if (!organizationId || !documentId || !versionId) {
    return { ok: false, error: "Missing upload identifiers.", status: 400 };
  }

  const document = await getDurableDocument(deps.db, organizationId, documentId);
  if (!document) {
    return { ok: false, error: "Document not found.", status: 404 };
  }
  const version = await getDurableVersion(
    deps.db,
    organizationId,
    documentId,
    versionId
  );
  if (!version) {
    return { ok: false, error: "Version not found.", status: 404 };
  }

  assertJagEvidencePathForOrganization(organizationId, version.storage_path);

  const verified = await verifyDurableStorageObject(deps.db, {
    bucket: JAG_EVIDENCE_DOCUMENTS_BUCKET,
    path: version.storage_path,
    expectedByteSize: version.byte_size,
  });

  if (!verified.ok) {
    await updateDurableUploadLifecycle(deps.db, {
      organizationId,
      documentId,
      versionId,
      documentLifecycle: "FAILED",
      versionStatus: "FAILED",
    });
    return { ok: false, error: verified.error, status: 400 };
  }

  const uploaded = await updateDurableUploadLifecycle(deps.db, {
    organizationId,
    documentId,
    versionId,
    documentLifecycle: "UPLOADED",
    versionStatus: "UPLOADED",
    byteSize: verified.size,
  });
  if (!uploaded.ok) return { ok: false, error: uploaded.error, status: 500 };

  const available = await updateDurableUploadLifecycle(deps.db, {
    organizationId,
    documentId,
    versionId,
    documentLifecycle: "AVAILABLE",
    versionStatus: "AVAILABLE",
    byteSize: verified.size,
    currentVersion: version.version_number,
  });
  if (!available.ok) return { ok: false, error: available.error, status: 500 };

  // Ensure document pointer fields match latest version
  await deps.db
    .from("jag_evidence_documents")
    .update({
      storage_path: version.storage_path,
      original_filename: version.original_filename,
      mime_type: version.mime_type,
      byte_size: verified.size,
      current_version: version.version_number,
      lifecycle_status: "AVAILABLE",
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("organization_id", organizationId);

  return {
    ok: true,
    documentId,
    versionId,
    lifecycleStatus: "AVAILABLE",
  };
}

export async function createEvidenceDownloadUrl(
  deps: {
    db: DurableEvidenceClient;
    storage: JagEvidenceSignedUrlClient;
  },
  input: {
    organizationId: string;
    documentId: string;
    versionId?: string;
    expiresInSeconds?: number;
  }
): Promise<
  | { ok: true; signedUrl: string; path: string; filename: string }
  | { ok: false; error: string; status?: number }
> {
  const document = await getDurableDocument(
    deps.db,
    input.organizationId,
    input.documentId
  );
  if (!document) {
    return { ok: false, error: "Document not found.", status: 404 };
  }
  if (document.lifecycle_status !== "AVAILABLE") {
    return { ok: false, error: "Document is not available for download.", status: 409 };
  }

  let version = input.versionId
    ? await getDurableVersion(
        deps.db,
        input.organizationId,
        input.documentId,
        input.versionId
      )
    : null;

  if (!version) {
    const versions = await listDurableVersionsForDocument(
      deps.db,
      input.organizationId,
      input.documentId
    );
    version =
      versions.find((v) => v.status === "AVAILABLE") ?? versions[0] ?? null;
  }

  if (!version || version.status !== "AVAILABLE") {
    return { ok: false, error: "No available version to download.", status: 409 };
  }

  try {
    const signedUrl = await createJagEvidenceSignedDownloadUrl({
      client: deps.storage,
      organizationId: input.organizationId,
      path: version.storage_path,
      expiresInSeconds: input.expiresInSeconds ?? 120,
    });
    return {
      ok: true,
      signedUrl,
      path: version.storage_path,
      filename: version.original_filename,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to mint download URL",
      status: 500,
    };
  }
}

export type DeleteDurableEvidenceDocumentResult =
  | {
      ok: true;
      documentId: string;
      organizationId: string;
      deletedVersionCount: number;
      deletedStorageObjectCount: number;
      absentStorageObjectCount: number;
    }
  | { ok: false; error: string; status?: number };

/**
 * Permanently delete a durable Evidence document, all versions, and Storage objects.
 *
 * Ordering (not a single distributed transaction):
 * 1) Validate DB paths and delete Storage objects (fail closed — leave DB intact).
 * 2) Delete version rows, then the document row.
 *
 * Residual risk: Storage deleted but DB delete fails — reported as failure; objects
 * may already be gone while rows remain (preferable to DB-gone + Storage orphan).
 *
 * Client-supplied organization_id / storage_path / version_id are never accepted here.
 */
export async function deleteDurableEvidenceDocument(
  deps: {
    db: DurableEvidenceClient;
    storage: JagEvidenceSignedUrlClient;
  },
  input: {
    /** Must already be authorized for the session — derived from the document row. */
    organizationId: string;
    documentId: string;
  }
): Promise<DeleteDurableEvidenceDocumentResult> {
  const organizationId = input.organizationId.trim();
  const documentId = input.documentId.trim();
  if (!organizationId || !documentId) {
    return { ok: false, error: "Document not found.", status: 404 };
  }

  const document = await getDurableDocument(deps.db, organizationId, documentId);
  if (!document) {
    return { ok: false, error: "Document not found.", status: 404 };
  }
  if (document.organization_id !== organizationId) {
    return { ok: false, error: "Document not found.", status: 404 };
  }

  const versions = await listDurableVersionsForDocument(
    deps.db,
    organizationId,
    documentId
  );

  for (const version of versions) {
    if (version.organization_id !== organizationId) {
      return {
        ok: false,
        error: "Version organization mismatch — refusing delete.",
        status: 409,
      };
    }
    if (version.document_id !== documentId) {
      return {
        ok: false,
        error: "Version document mismatch — refusing delete.",
        status: 409,
      };
    }
    try {
      assertJagEvidencePathForOrganization(organizationId, version.storage_path);
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Invalid version storage path — refusing delete.",
        status: 409,
      };
    }
  }

  let deletedStorageObjectCount = 0;
  let absentStorageObjectCount = 0;
  for (const version of versions) {
    const removed = await removeJagEvidenceStorageObject({
      client: deps.storage,
      organizationId,
      documentId,
      versionId: version.id,
      path: version.storage_path,
    });
    if (!removed.ok) {
      return {
        ok: false,
        error: `Storage cleanup failed: ${removed.error}. Database records were left intact.`,
        status: 502,
      };
    }
    if (removed.absent) absentStorageObjectCount += 1;
    else deletedStorageObjectCount += 1;
  }

  const versionsDeleted = await deleteDurableEvidenceVersions(
    deps.db,
    organizationId,
    documentId
  );
  if (!versionsDeleted.ok) {
    return {
      ok: false,
      error: `Storage objects were removed but version rows could not be deleted: ${versionsDeleted.error}`,
      status: 500,
    };
  }

  const documentDeleted = await deleteDurableEvidenceDocumentRow(
    deps.db,
    organizationId,
    documentId
  );
  if (!documentDeleted.ok) {
    return {
      ok: false,
      error: `Storage objects were removed but the document row could not be deleted: ${documentDeleted.error}`,
      status: 500,
    };
  }

  return {
    ok: true,
    documentId,
    organizationId,
    deletedVersionCount: versionsDeleted.deletedCount,
    deletedStorageObjectCount,
    absentStorageObjectCount,
  };
}

// Re-export types used by routes for metadata enums (keeps imports local).
export type {
  EvidenceDomain,
  EvidenceType,
  EvidenceSource,
  ConfidentialityLevel,
  ReportingPeriodKind,
};
