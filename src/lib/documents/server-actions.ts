"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { requireDocumentsEditAccess } from "./access";
import {
  archiveDocument,
  createDocument,
  deleteDocument,
  rejectDocument,
  approveDocument,
  requestDocumentSignature,
  restoreDocument,
  restoreDocumentVersion,
  routeDocumentForReview,
  updateDocument,
} from "./service";
import { duplicateFromTemplate } from "./templates";
import type { DocumentCategory, DocumentRelationEntityType, DocumentStatus } from "./types";

function revalidateDocuments() {
  revalidatePath("/dashboard/documents");
}

export async function createDocumentAction(formData: FormData) {
  const access = await requireDocumentsEditAccess();
  if (!access.ok) return { error: access.error };

  const identity = await getIdentityContext();
  const supabase = await createAuthClient();

  const relationsRaw = String(formData.get("relations") ?? "").trim();
  const relations = relationsRaw
    ? relationsRaw.split(";").map((pair) => {
        const [entityType, entityId] = pair.split(":");
        return {
          entityType: entityType as DocumentRelationEntityType,
          entityId: entityId!,
          isPrimary: true,
        };
      }).filter((r) => r.entityType && r.entityId)
    : [];

  const studentId = String(formData.get("student_id") ?? "").trim();
  const familyId = String(formData.get("family_id") ?? "").trim();
  const employeeId = String(formData.get("employee_id") ?? "").trim();
  if (studentId) relations.push({ entityType: "student", entityId: studentId, isPrimary: true });
  if (familyId) relations.push({ entityType: "family", entityId: familyId, isPrimary: true });
  if (employeeId) relations.push({ entityType: "employee", entityId: employeeId, isPrimary: true });

  const schoolId =
    String(formData.get("school_id") ?? "") ||
    identity?.accessibleSchoolIds?.[0] ||
    null;

  if (schoolId) {
    relations.push({ entityType: "school", entityId: schoolId, isPrimary: false });
  }

  const result = await createDocument(supabase, {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: (String(formData.get("category") ?? "other") || "other") as DocumentCategory,
    documentType: String(formData.get("document_type") ?? "file"),
    schoolId,
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    status: (String(formData.get("status") ?? "active") || "active") as DocumentStatus,
    fileName: String(formData.get("file_name") ?? "") || null,
    mimeType: String(formData.get("mime_type") ?? "") || null,
    fileUrl: String(formData.get("file_url") ?? "") || null,
    storagePath: String(formData.get("storage_path") ?? "") || null,
    fileSizeBytes: formData.get("file_size_bytes")
      ? Number(formData.get("file_size_bytes"))
      : null,
    templateId: String(formData.get("template_id") ?? "") || null,
    workflowId: String(formData.get("workflow_id") ?? "") || null,
    relations,
    policyLocked: formData.get("policy_locked") === "true",
    requiresSignature: formData.get("requires_signature") === "true",
  });

  if (!result.ok) return { error: result.error, code: result.code };
  revalidateDocuments();
  return result;
}

export async function updateDocumentAction(documentId: string, formData: FormData) {
  const access = await requireDocumentsEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();

  const result = await updateDocument(supabase, documentId, {
    title: String(formData.get("title") ?? "") || undefined,
    description: formData.has("description")
      ? String(formData.get("description") ?? "")
      : undefined,
    category: formData.has("category")
      ? (String(formData.get("category")) as DocumentCategory)
      : undefined,
    tags: formData.has("tags")
      ? String(formData.get("tags") ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined,
    fileName: formData.has("file_name")
      ? String(formData.get("file_name") ?? "") || null
      : undefined,
    mimeType: formData.has("mime_type")
      ? String(formData.get("mime_type") ?? "") || null
      : undefined,
    fileUrl: formData.has("file_url")
      ? String(formData.get("file_url") ?? "") || null
      : undefined,
    storagePath: formData.has("storage_path")
      ? String(formData.get("storage_path") ?? "") || null
      : undefined,
    changeSummary: String(formData.get("change_summary") ?? "") || "Document updated",
    createVersion: formData.get("create_version") !== "false",
  });

  if (!result.ok) return { error: result.error, code: result.code };
  revalidateDocuments();
  return result;
}

export async function archiveDocumentAction(documentId: string) {
  const access = await requireDocumentsEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await archiveDocument(supabase, documentId);
  if (!result.ok) return { error: result.error };
  revalidateDocuments();
  return result;
}

export async function restoreDocumentAction(documentId: string) {
  const access = await requireDocumentsEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await restoreDocument(supabase, documentId);
  if (!result.ok) return { error: result.error };
  revalidateDocuments();
  return result;
}

export async function deleteDocumentAction(input: {
  documentId: string;
  confirmationText: string;
  acknowledged: boolean;
}) {
  const access = await requireDocumentsEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await deleteDocument(supabase, input);
  if (!result.ok) {
    return {
      error: result.error,
      code: result.code,
      suggestArchive: result.suggestArchive,
    };
  }
  revalidateDocuments();
  return result;
}

export async function restoreDocumentVersionAction(
  documentId: string,
  versionNumber: number
) {
  const access = await requireDocumentsEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await restoreDocumentVersion(supabase, documentId, versionNumber);
  if (!result.ok) return { error: result.error };
  revalidateDocuments();
  return result;
}

export async function duplicateFromTemplateAction(templateId: string, formData?: FormData) {
  const access = await requireDocumentsEditAccess();
  if (!access.ok) return { error: access.error };
  const identity = await getIdentityContext();
  const supabase = await createAuthClient();
  const studentId = formData ? String(formData.get("student_id") ?? "").trim() : "";
  const result = await duplicateFromTemplate(supabase, templateId, {
    title: formData ? String(formData.get("title") ?? "") || undefined : undefined,
    schoolId:
      (formData ? String(formData.get("school_id") ?? "") : "") ||
      identity?.accessibleSchoolIds?.[0] ||
      null,
    relations: studentId
      ? [{ entityType: "student", entityId: studentId, isPrimary: true }]
      : undefined,
  });
  if (!result.ok) return { error: result.error };
  revalidateDocuments();
  return result;
}

export async function approveDocumentAction(documentId: string) {
  const access = await requireDocumentsEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await approveDocument(supabase, documentId);
  if (!result.ok) return { error: result.error };
  revalidateDocuments();
  return result;
}

export async function rejectDocumentAction(documentId: string, reason?: string) {
  const access = await requireDocumentsEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await rejectDocument(supabase, documentId, reason);
  if (!result.ok) return { error: result.error };
  revalidateDocuments();
  return result;
}

export async function routeDocumentForReviewAction(documentId: string) {
  const access = await requireDocumentsEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await routeDocumentForReview(supabase, documentId);
  if (!result.ok) return { error: result.error };
  revalidateDocuments();
  return result;
}

export async function requestSignatureAction(documentId: string) {
  const access = await requireDocumentsEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await requestDocumentSignature(supabase, documentId);
  if (!result.ok) return { error: result.error };
  revalidateDocuments();
  return result;
}
