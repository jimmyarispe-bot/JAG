/**
 * Phase 2 — durable JAG Evidence document/version persistence (Postgres).
 * App-layer authorization happens before these calls; uses service-role client.
 */

import type {
  JagEvidenceDocumentLifecycle,
  JagEvidenceVersionStatus,
} from "@/lib/evidence-center/storage";
import type {
  ConfidentialityLevel,
  EvidenceDocument,
  EvidenceDomain,
  EvidenceSource,
  EvidenceStatus,
  EvidenceType,
  EvidenceVersion,
  ReportingPeriodKind,
} from "@/lib/evidence-center/types";

/**
 * Minimal Supabase-like client for JAG Evidence tables.
 * Tables are not yet in generated Database types — use a loose client surface.
 */
export type DurableEvidenceClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
  storage: {
    from: (bucket: string) => {
      list: (
        path?: string,
        options?: { limit?: number; search?: string }
      ) => Promise<{
        data: { name: string; metadata?: { size?: number }; size?: number }[] | null;
        error: { message: string } | null;
      }>;
      /** Prefer object info when available (supabase-js StorageFileApi.info). */
      info?: (path: string) => Promise<{
        data: { size?: number; metadata?: { size?: number } } | null;
        error: { message: string } | null;
      }>;
      exists?: (path: string) => Promise<{
        data: boolean | null;
        error: { message: string } | null;
      }>;
      /** Service-role object deletion (Phase 4). */
      remove?: (
        paths: string[]
      ) => Promise<{
        data: unknown;
        error: { message: string; status?: number; statusCode?: string } | null;
      }>;
    };
  };
};

export type DurableEvidenceDocumentRow = {
  id: string;
  organization_id: string;
  name: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  storage_path: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  lifecycle_status: JagEvidenceDocumentLifecycle;
  current_version: number;
  domain: string;
  evidence_type: string;
  description: string;
  tags: string[] | null;
  reporting_period_kind: string;
  reporting_period_label: string;
  business_unit: string;
  department: string;
  location: string;
  owner: string;
  source: string;
  confidentiality: string;
};

export type DurableEvidenceVersionRow = {
  id: string;
  document_id: string;
  organization_id: string;
  version_number: number;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  uploaded_by: string | null;
  created_at: string;
  status: JagEvidenceVersionStatus;
};

function lifecycleToCatalogStatus(
  lifecycle: JagEvidenceDocumentLifecycle
): EvidenceStatus {
  switch (lifecycle) {
    case "UPLOADING":
      return "queued";
    case "UPLOADED":
      return "processing";
    case "AVAILABLE":
      return "completed";
    case "FAILED":
      return "failed";
    case "ARCHIVED":
      return "completed";
    default:
      return "queued";
  }
}

export function mapDurableDocumentToCatalog(
  row: DurableEvidenceDocumentRow,
  organizationName: string
): EvidenceDocument {
  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationName,
    name: row.name,
    storagePath: row.storage_path,
    domain: row.domain as EvidenceDomain,
    evidenceType: row.evidence_type as EvidenceType,
    description: row.description ?? "",
    tags: Object.freeze([...(row.tags ?? [])]),
    reportingPeriodKind: row.reporting_period_kind as ReportingPeriodKind,
    reportingPeriodLabel: row.reporting_period_label ?? "",
    businessUnit: row.business_unit ?? "Corporate",
    department: row.department ?? "",
    location: row.location ?? "",
    owner: row.owner ?? "",
    source: row.source as EvidenceSource,
    confidentiality: row.confidentiality as ConfidentialityLevel,
    currentVersion: row.current_version,
    status: lifecycleToCatalogStatus(row.lifecycle_status),
    createdBy: row.created_by ?? "",
    createdByName: row.owner || "Unknown",
    fileName: row.original_filename,
    mimeType: row.mime_type,
    byteSize: Number(row.byte_size) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    timeline: Object.freeze([]),
  };
}

export function mapDurableVersionToCatalog(
  row: DurableEvidenceVersionRow
): EvidenceVersion {
  return {
    id: row.id,
    documentId: row.document_id,
    organizationId: row.organization_id,
    versionNumber: row.version_number,
    fileName: row.original_filename,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    byteSize: Number(row.byte_size) || 0,
    isLatest: true,
    superseded: false,
    createdBy: row.uploaded_by ?? "",
    createdByName: "",
    createdAt: row.created_at,
    notes: row.status,
  };
}

export async function insertDurableDocument(
  client: DurableEvidenceClient,
  row: Omit<DurableEvidenceDocumentRow, "created_at" | "updated_at"> & {
    created_at?: string;
    updated_at?: string;
  }
): Promise<{ ok: true; row: DurableEvidenceDocumentRow } | { ok: false; error: string }> {
  const { data, error } = await client
    .from("jag_evidence_documents")
    .insert({
      id: row.id,
      organization_id: row.organization_id,
      name: row.name,
      original_filename: row.original_filename,
      mime_type: row.mime_type,
      byte_size: row.byte_size,
      storage_path: row.storage_path,
      created_by: row.created_by,
      lifecycle_status: row.lifecycle_status,
      current_version: row.current_version,
      domain: row.domain,
      evidence_type: row.evidence_type,
      description: row.description,
      tags: row.tags ?? [],
      reporting_period_kind: row.reporting_period_kind,
      reporting_period_label: row.reporting_period_label,
      business_unit: row.business_unit,
      department: row.department,
      location: row.location,
      owner: row.owner,
      source: row.source,
      confidentiality: row.confidentiality,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create document" };
  }
  return { ok: true, row: data as DurableEvidenceDocumentRow };
}

export async function insertDurableVersion(
  client: DurableEvidenceClient,
  row: Omit<DurableEvidenceVersionRow, "created_at"> & { created_at?: string }
): Promise<{ ok: true; row: DurableEvidenceVersionRow } | { ok: false; error: string }> {
  const { data, error } = await client
    .from("jag_evidence_document_versions")
    .insert({
      id: row.id,
      document_id: row.document_id,
      organization_id: row.organization_id,
      version_number: row.version_number,
      storage_path: row.storage_path,
      original_filename: row.original_filename,
      mime_type: row.mime_type,
      byte_size: row.byte_size,
      uploaded_by: row.uploaded_by,
      status: row.status,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create version" };
  }
  return { ok: true, row: data as DurableEvidenceVersionRow };
}

export async function getDurableDocument(
  client: DurableEvidenceClient,
  organizationId: string,
  documentId: string
): Promise<DurableEvidenceDocumentRow | null> {
  const { data, error } = await client
    .from("jag_evidence_documents")
    .select("*")
    .eq("id", documentId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error || !data) return null;
  return data as DurableEvidenceDocumentRow;
}

/** Lookup by document id only — caller must authorize against row.organization_id. */
export async function getDurableDocumentById(
  client: DurableEvidenceClient,
  documentId: string
): Promise<DurableEvidenceDocumentRow | null> {
  const { data, error } = await client
    .from("jag_evidence_documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();
  if (error || !data) return null;
  return data as DurableEvidenceDocumentRow;
}

export async function getDurableVersion(
  client: DurableEvidenceClient,
  organizationId: string,
  documentId: string,
  versionId: string
): Promise<DurableEvidenceVersionRow | null> {
  const { data, error } = await client
    .from("jag_evidence_document_versions")
    .select("*")
    .eq("id", versionId)
    .eq("document_id", documentId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error || !data) return null;
  return data as DurableEvidenceVersionRow;
}

export async function listDurableDocumentsForOrganization(
  client: DurableEvidenceClient,
  organizationId: string
): Promise<DurableEvidenceDocumentRow[]> {
  const { data, error } = await client
    .from("jag_evidence_documents")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as DurableEvidenceDocumentRow[];
}

export async function listDurableVersionsForDocument(
  client: DurableEvidenceClient,
  organizationId: string,
  documentId: string
): Promise<DurableEvidenceVersionRow[]> {
  const { data, error } = await client
    .from("jag_evidence_document_versions")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("document_id", documentId)
    .order("version_number", { ascending: false });
  if (error || !data) return [];
  return data as DurableEvidenceVersionRow[];
}

export async function updateDurableUploadLifecycle(
  client: DurableEvidenceClient,
  input: {
    organizationId: string;
    documentId: string;
    versionId: string;
    documentLifecycle: JagEvidenceDocumentLifecycle;
    versionStatus: JagEvidenceVersionStatus;
    byteSize?: number;
    currentVersion?: number;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  const docPatch: Record<string, unknown> = {
    lifecycle_status: input.documentLifecycle,
    updated_at: now,
  };
  if (typeof input.byteSize === "number") docPatch.byte_size = input.byteSize;
  if (typeof input.currentVersion === "number") {
    docPatch.current_version = input.currentVersion;
  }

  const { error: docError } = await client
    .from("jag_evidence_documents")
    .update(docPatch)
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId);

  if (docError) return { ok: false, error: docError.message };

  const versionPatch: Record<string, unknown> = {
    status: input.versionStatus,
  };
  if (typeof input.byteSize === "number") versionPatch.byte_size = input.byteSize;

  const { error: verError } = await client
    .from("jag_evidence_document_versions")
    .update(versionPatch)
    .eq("id", input.versionId)
    .eq("document_id", input.documentId)
    .eq("organization_id", input.organizationId);

  if (verError) return { ok: false, error: verError.message };
  return { ok: true };
}

function coercePositiveSize(value: unknown): number | null {
  const size = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(size) || size <= 0) return null;
  return size;
}

/**
 * Verify the exact Storage object exists and matches expected byte size.
 * Does not trust browser success or authorize-time claimed size alone.
 */
export async function verifyDurableStorageObject(
  client: DurableEvidenceClient,
  input: { bucket: string; path: string; expectedByteSize: number }
): Promise<{ ok: true; size: number } | { ok: false; error: string }> {
  const slash = input.path.lastIndexOf("/");
  if (slash <= 0) return { ok: false, error: "Invalid storage path." };
  const folder = input.path.slice(0, slash);
  const fileName = input.path.slice(slash + 1);
  const bucket = client.storage.from(input.bucket);

  let resolvedSize: number | null = null;
  let objectFound = false;

  if (typeof bucket.info === "function") {
    const infoResult = await bucket.info(input.path);
    if (!infoResult.error && infoResult.data) {
      objectFound = true;
      resolvedSize =
        coercePositiveSize(infoResult.data.size) ??
        coercePositiveSize(infoResult.data.metadata?.size);
    }
  }

  if (!objectFound || resolvedSize === null) {
    const { data, error } = await bucket.list(folder, {
      limit: 100,
      search: fileName,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    const match = (data ?? []).find((item) => item.name === fileName);
    if (match) {
      objectFound = true;
      if (resolvedSize === null) {
        resolvedSize =
          coercePositiveSize(match.metadata?.size) ??
          coercePositiveSize(match.size);
      }
    }
  }

  if (!objectFound && typeof bucket.exists === "function") {
    const existsResult = await bucket.exists(input.path);
    if (!existsResult.error && existsResult.data === true) {
      objectFound = true;
    }
  }

  if (!objectFound) {
    return { ok: false, error: "Uploaded object was not found in storage." };
  }

  if (resolvedSize === null) {
    return {
      ok: false,
      error:
        "Uploaded object was found but size metadata is unavailable; refusing AVAILABLE transition.",
    };
  }

  if (resolvedSize !== input.expectedByteSize) {
    return {
      ok: false,
      error: `Stored size mismatch (expected ${input.expectedByteSize}, got ${resolvedSize}).`,
    };
  }
  return { ok: true, size: resolvedSize };
}

export async function deleteDurableEvidenceVersions(
  client: DurableEvidenceClient,
  organizationId: string,
  documentId: string
): Promise<{ ok: true; deletedCount: number } | { ok: false; error: string }> {
  const { data, error } = await client
    .from("jag_evidence_document_versions")
    .delete()
    .eq("organization_id", organizationId)
    .eq("document_id", documentId)
    .select("id");
  if (error) return { ok: false, error: error.message };
  return { ok: true, deletedCount: Array.isArray(data) ? data.length : 0 };
}

export async function deleteDurableEvidenceDocumentRow(
  client: DurableEvidenceClient,
  organizationId: string,
  documentId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await client
    .from("jag_evidence_documents")
    .delete()
    .eq("id", documentId)
    .eq("organization_id", organizationId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
