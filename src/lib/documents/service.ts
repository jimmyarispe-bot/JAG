import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordDocumentActivity } from "./activity";
import { requestSignature } from "./esign";
import type {
  ALLOWED_UPLOAD_MIME_TYPES,
  CreateDocumentInput,
  DocumentRelationInput,
  DocumentRow,
  DocumentStatus,
} from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type DocumentMutationResult =
  | { ok: true; documentId: string; auditId: string; version: number; status: DocumentStatus }
  | { ok: false; error: string; code?: string; suggestArchive?: boolean };

const ALLOWED = new Set<string>([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/csv",
  "text/plain",
]);

export function isAllowedUploadMime(mimeType: string | null | undefined): boolean {
  if (!mimeType) return true;
  return ALLOWED.has(mimeType) || mimeType.startsWith("image/") || mimeType.startsWith("video/");
}

async function loadDocument(
  supabase: AuthClient,
  id: string
): Promise<DocumentRow | null> {
  const { data } = await supabase
    .from("platform_documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as DocumentRow | null) ?? null;
}

async function insertVersionSnapshot(
  supabase: AuthClient,
  doc: DocumentRow,
  changeSummary: string | null,
  actorUserId: string | null
) {
  await supabase.from("platform_document_versions").insert({
    document_id: doc.id,
    version_number: doc.current_version,
    title: doc.title,
    description: doc.description,
    mime_type: doc.mime_type,
    file_name: doc.file_name,
    storage_path: doc.storage_path,
    file_url: doc.file_url,
    file_size_bytes: doc.file_size_bytes,
    change_summary: changeSummary,
    created_by: actorUserId,
  });
}

async function syncRelations(
  supabase: AuthClient,
  documentId: string,
  relations: DocumentRelationInput[]
) {
  if (!relations.length) return;
  await supabase.from("platform_document_relations").upsert(
    relations.map((r) => ({
      document_id: documentId,
      entity_type: r.entityType,
      entity_id: r.entityId,
      is_primary: r.isPrimary ?? false,
    })),
    { onConflict: "document_id,entity_type,entity_id" }
  );
}

async function primaryRelationIds(
  supabase: AuthClient,
  documentId: string
): Promise<{ studentId: string | null; familyId: string | null }> {
  const { data } = await supabase
    .from("platform_document_relations")
    .select("entity_type, entity_id")
    .eq("document_id", documentId)
    .in("entity_type", ["student", "family"]);
  const studentId =
    data?.find((r) => r.entity_type === "student")?.entity_id ?? null;
  const familyId =
    data?.find((r) => r.entity_type === "family")?.entity_id ?? null;
  return { studentId, familyId };
}

export async function createDocument(
  supabase: AuthClient,
  input: CreateDocumentInput
): Promise<DocumentMutationResult> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required" };

  if (input.mimeType && !isAllowedUploadMime(input.mimeType)) {
    return {
      ok: false,
      error: `Unsupported file type: ${input.mimeType}`,
      code: "unsupported_type",
    };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const schoolCtx = input.schoolId
    ? await resolveSchoolContext(supabase, input.schoolId)
    : null;

  const status: DocumentStatus = input.status ?? "active";
  const { data, error } = await supabase
    .from("platform_documents")
    .insert({
      organization_id: input.organizationId ?? schoolCtx?.organizationId ?? null,
      school_id: input.schoolId ?? null,
      title,
      description: input.description ?? "",
      category: input.category ?? "other",
      document_type: input.documentType ?? "file",
      status,
      current_version: 1,
      mime_type: input.mimeType ?? null,
      file_name: input.fileName ?? null,
      storage_path: input.storagePath ?? null,
      file_url: input.fileUrl ?? null,
      file_size_bytes: input.fileSizeBytes ?? null,
      tags: input.tags ?? [],
      owner_user_id: actorUserId,
      uploaded_by: actorUserId,
      template_id: input.templateId ?? null,
      workflow_id: input.workflowId ?? null,
      requires_signature: input.requiresSignature ?? false,
      policy_locked: input.policyLocked ?? false,
      metadata: input.metadata ?? {},
    })
    .select("id, audit_id, current_version, status")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create document" };
  }

  const row = await loadDocument(supabase, data.id);
  if (row) {
    await insertVersionSnapshot(supabase, row, "Initial version", actorUserId);
  }
  if (input.relations?.length) {
    await syncRelations(supabase, data.id, input.relations);
  }

  const rel = await primaryRelationIds(supabase, data.id);
  await recordDocumentActivity(supabase, {
    eventType: "document.created",
    title: "Document created",
    summary: title,
    entityId: data.id,
    organizationId: input.organizationId ?? schoolCtx?.organizationId,
    schoolId: input.schoolId,
    studentId: rel.studentId,
    familyId: rel.familyId,
    actorUserId,
    payload: { auditId: data.audit_id, category: input.category ?? "other" },
  });

  if (input.fileUrl || input.storagePath) {
    await recordDocumentActivity(supabase, {
      eventType: "document.uploaded",
      title: "Document uploaded",
      summary: title,
      entityId: data.id,
      organizationId: input.organizationId ?? schoolCtx?.organizationId,
      schoolId: input.schoolId,
      studentId: rel.studentId,
      familyId: rel.familyId,
      actorUserId,
      payload: { mimeType: input.mimeType, fileName: input.fileName },
    });
  }

  return {
    ok: true,
    documentId: data.id,
    auditId: data.audit_id,
    version: data.current_version,
    status: data.status as DocumentStatus,
  };
}

export async function updateDocument(
  supabase: AuthClient,
  documentId: string,
  patch: {
    title?: string;
    description?: string;
    category?: CreateDocumentInput["category"];
    tags?: string[];
    status?: DocumentStatus;
    fileName?: string | null;
    mimeType?: string | null;
    storagePath?: string | null;
    fileUrl?: string | null;
    fileSizeBytes?: number | null;
    changeSummary?: string;
    relations?: DocumentRelationInput[];
    createVersion?: boolean;
  }
): Promise<DocumentMutationResult> {
  const row = await loadDocument(supabase, documentId);
  if (!row) return { ok: false, error: "Document not found", code: "not_found" };
  if (row.status === "archived") {
    return { ok: false, error: "Restore the document before editing", code: "archived" };
  }

  if (patch.mimeType && !isAllowedUploadMime(patch.mimeType)) {
    return { ok: false, error: `Unsupported file type: ${patch.mimeType}`, code: "unsupported_type" };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const createVersion = patch.createVersion !== false;
  const nextVersion = createVersion ? row.current_version + 1 : row.current_version;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    current_version: nextVersion,
  };
  if (patch.title !== undefined) updates.title = patch.title.trim() || row.title;
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.category !== undefined) updates.category = patch.category;
  if (patch.tags !== undefined) updates.tags = patch.tags;
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.fileName !== undefined) updates.file_name = patch.fileName;
  if (patch.mimeType !== undefined) updates.mime_type = patch.mimeType;
  if (patch.storagePath !== undefined) updates.storage_path = patch.storagePath;
  if (patch.fileUrl !== undefined) updates.file_url = patch.fileUrl;
  if (patch.fileSizeBytes !== undefined) updates.file_size_bytes = patch.fileSizeBytes;

  const { error } = await supabase
    .from("platform_documents")
    .update(updates)
    .eq("id", documentId);
  if (error) return { ok: false, error: error.message };

  const updated = await loadDocument(supabase, documentId);
  if (updated && createVersion) {
    await insertVersionSnapshot(
      supabase,
      updated,
      patch.changeSummary ?? "Document updated",
      actorUserId
    );
  }
  if (patch.relations) {
    await syncRelations(supabase, documentId, patch.relations);
  }

  const rel = await primaryRelationIds(supabase, documentId);
  await recordDocumentActivity(supabase, {
    eventType: createVersion ? "document.versioned" : "document.updated",
    title: createVersion ? "Document versioned" : "Document updated",
    summary: updated?.title ?? row.title,
    entityId: documentId,
    organizationId: row.organization_id,
    schoolId: row.school_id,
    studentId: rel.studentId,
    familyId: rel.familyId,
    actorUserId,
    payload: {
      auditId: row.audit_id,
      version: nextVersion,
      previousVersion: row.current_version,
    },
  });

  return {
    ok: true,
    documentId,
    auditId: row.audit_id,
    version: nextVersion,
    status: (updated?.status ?? row.status) as DocumentStatus,
  };
}

export async function restoreDocumentVersion(
  supabase: AuthClient,
  documentId: string,
  versionNumber: number
): Promise<DocumentMutationResult> {
  const row = await loadDocument(supabase, documentId);
  if (!row) return { ok: false, error: "Document not found", code: "not_found" };

  const { data: version } = await supabase
    .from("platform_document_versions")
    .select("*")
    .eq("document_id", documentId)
    .eq("version_number", versionNumber)
    .maybeSingle();

  if (!version) return { ok: false, error: "Version not found", code: "not_found" };

  return updateDocument(supabase, documentId, {
    title: version.title,
    description: version.description,
    fileName: version.file_name,
    mimeType: version.mime_type,
    storagePath: version.storage_path,
    fileUrl: version.file_url,
    fileSizeBytes: version.file_size_bytes,
    changeSummary: `Restored from version ${versionNumber}`,
    createVersion: true,
  });
}

export async function archiveDocument(
  supabase: AuthClient,
  documentId: string
): Promise<DocumentMutationResult> {
  const row = await loadDocument(supabase, documentId);
  if (!row) return { ok: false, error: "Document not found", code: "not_found" };

  const actorUserId = await resolveActorUserId(supabase);
  const now = new Date().toISOString();
  await supabase
    .from("platform_documents")
    .update({ status: "archived", archived_at: now, updated_at: now })
    .eq("id", documentId);

  const rel = await primaryRelationIds(supabase, documentId);
  await recordDocumentActivity(supabase, {
    eventType: "document.archived",
    title: "Document archived",
    summary: row.title,
    entityId: documentId,
    organizationId: row.organization_id,
    schoolId: row.school_id,
    studentId: rel.studentId,
    familyId: rel.familyId,
    actorUserId,
    payload: { auditId: row.audit_id },
  });

  return {
    ok: true,
    documentId,
    auditId: row.audit_id,
    version: row.current_version,
    status: "archived",
  };
}

export async function restoreDocument(
  supabase: AuthClient,
  documentId: string
): Promise<DocumentMutationResult> {
  const row = await loadDocument(supabase, documentId);
  if (!row) return { ok: false, error: "Document not found", code: "not_found" };
  if (row.status !== "archived") {
    return { ok: false, error: "Document is not archived" };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const now = new Date().toISOString();
  await supabase
    .from("platform_documents")
    .update({ status: "active", archived_at: null, updated_at: now })
    .eq("id", documentId);

  const rel = await primaryRelationIds(supabase, documentId);
  await recordDocumentActivity(supabase, {
    eventType: "document.restored",
    title: "Document restored",
    summary: row.title,
    entityId: documentId,
    organizationId: row.organization_id,
    schoolId: row.school_id,
    studentId: rel.studentId,
    familyId: rel.familyId,
    actorUserId,
    payload: { auditId: row.audit_id },
  });

  return {
    ok: true,
    documentId,
    auditId: row.audit_id,
    version: row.current_version,
    status: "active",
  };
}

export async function deleteDocument(
  supabase: AuthClient,
  input: {
    documentId: string;
    confirmationText: string;
    acknowledged: boolean;
  }
): Promise<DocumentMutationResult> {
  const { validateDeleteConfirmation } = await import("@/lib/platform/crud");
  const confirmation = validateDeleteConfirmation(input);
  if (!confirmation.ok) {
    return { ok: false, error: confirmation.error, code: confirmation.code };
  }

  const row = await loadDocument(supabase, input.documentId);
  if (!row) return { ok: false, error: "Document not found", code: "not_found" };

  if (row.policy_locked) {
    return {
      ok: false,
      error: "This document is policy-locked and cannot be permanently deleted. Archive instead.",
      code: "policy_locked",
      suggestArchive: true,
    };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const rel = await primaryRelationIds(supabase, row.id);

  await supabase.from("platform_document_relations").delete().eq("document_id", row.id);
  await supabase.from("platform_document_versions").delete().eq("document_id", row.id);
  const { error } = await supabase.from("platform_documents").delete().eq("id", row.id);
  if (error) return { ok: false, error: error.message };

  await recordDocumentActivity(supabase, {
    eventType: "document.deleted",
    title: "Document deleted",
    summary: row.title,
    entityId: row.id,
    organizationId: row.organization_id,
    schoolId: row.school_id,
    studentId: rel.studentId,
    familyId: rel.familyId,
    actorUserId,
    payload: { auditId: row.audit_id },
  });

  return {
    ok: true,
    documentId: row.id,
    auditId: row.audit_id,
    version: row.current_version,
    status: row.status,
  };
}

export async function approveDocument(
  supabase: AuthClient,
  documentId: string
): Promise<DocumentMutationResult> {
  return updateDocument(supabase, documentId, {
    status: "approved",
    changeSummary: "Approved",
    createVersion: true,
  });
}

export async function rejectDocument(
  supabase: AuthClient,
  documentId: string,
  reason?: string
): Promise<DocumentMutationResult> {
  return updateDocument(supabase, documentId, {
    status: "rejected",
    changeSummary: reason ? `Rejected: ${reason}` : "Rejected",
    createVersion: true,
  });
}

export async function routeDocumentForReview(
  supabase: AuthClient,
  documentId: string
): Promise<DocumentMutationResult> {
  return updateDocument(supabase, documentId, {
    status: "pending_review",
    changeSummary: "Routed for review",
    createVersion: true,
  });
}

export async function requestDocumentSignature(
  supabase: AuthClient,
  documentId: string,
  provider?: "docusign" | "dropbox_sign" | "adobe_sign"
): Promise<DocumentMutationResult> {
  const row = await loadDocument(supabase, documentId);
  if (!row) return { ok: false, error: "Document not found", code: "not_found" };

  const result = await requestSignature({
    documentId,
    title: row.title,
    fileUrl: row.file_url,
    organizationId: row.organization_id,
    schoolId: row.school_id,
    provider,
  });

  await supabase
    .from("platform_documents")
    .update({
      requires_signature: true,
      signature_status: "requested",
      signature_provider: result.provider,
      signature_external_id: result.externalId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  const actorUserId = await resolveActorUserId(supabase);
  const rel = await primaryRelationIds(supabase, documentId);
  await recordDocumentActivity(supabase, {
    eventType: "signature.requested",
    title: "Signature requested",
    summary: row.title,
    entityId: documentId,
    organizationId: row.organization_id,
    schoolId: row.school_id,
    studentId: rel.studentId,
    familyId: rel.familyId,
    actorUserId,
    payload: {
      provider: result.provider,
      deferred: result.deferred,
      message: result.message,
    },
  });

  return {
    ok: true,
    documentId,
    auditId: row.audit_id,
    version: row.current_version,
    status: row.status,
  };
}

export async function getDocument(
  supabase: AuthClient,
  documentId: string
): Promise<DocumentRow | null> {
  return loadDocument(supabase, documentId);
}

/** Type-only re-export helper for consumers that import ALLOWED list */
export type AllowedMime = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];
