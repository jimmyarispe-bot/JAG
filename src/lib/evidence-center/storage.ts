/**
 * JAG Evidence documents — private storage foundation (Phase 1).
 *
 * Bucket: jag-evidence-documents (private; signed URLs in Phase 2).
 * Path: org/{organization_id}/documents/{document_id}/versions/{version_id}/{safe_filename}
 *
 * Callers must pass organization/document/version IDs from the server —
 * never trust a client-supplied organization path segment.
 */

export const JAG_EVIDENCE_DOCUMENTS_BUCKET = "jag-evidence-documents" as const;

/** 20 MiB — matches bucket file_size_limit in migration 220. */
export const JAG_EVIDENCE_MAX_BYTES = 20 * 1024 * 1024;

export const JAG_EVIDENCE_ALLOWED_EXTENSIONS = [
  "pdf",
  "docx",
  "xlsx",
  "csv",
  "pptx",
  "txt",
] as const;

export type JagEvidenceAllowedExtension =
  (typeof JAG_EVIDENCE_ALLOWED_EXTENSIONS)[number];

export const JAG_EVIDENCE_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "text/plain",
] as const;

export type JagEvidenceDocumentLifecycle =
  | "UPLOADING"
  | "UPLOADED"
  | "AVAILABLE"
  | "FAILED"
  | "ARCHIVED";

export type JagEvidenceVersionStatus =
  | "UPLOADING"
  | "UPLOADED"
  | "AVAILABLE"
  | "FAILED";

export type JagEvidenceObjectRef = {
  readonly bucket: typeof JAG_EVIDENCE_DOCUMENTS_BUCKET;
  readonly path: string;
  readonly organizationId: string;
  readonly documentId: string;
  readonly versionId: string;
  readonly safeFilename: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PATH_RE =
  /^org\/([0-9a-f-]{36})\/documents\/([0-9a-f-]{36})\/versions\/([0-9a-f-]{36})\/([^/]+)$/i;

function assertUuid(value: string, label: string): string {
  const trimmed = value.trim();
  if (!UUID_RE.test(trimmed)) {
    throw new Error(`Invalid JAG Evidence ${label}: expected UUID`);
  }
  return trimmed.toLowerCase();
}

/**
 * Sanitize a user-supplied filename for object storage.
 * Strips path segments, rejects traversal, keeps a conservative charset.
 */
export function sanitizeJagEvidenceFilename(filename: string): string {
  const base =
    filename.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? "file";
  let cleaned = base
    .replace(/[^\w.\-()+ ]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 180);
  if (!cleaned || cleaned === "." || cleaned === "..") {
    cleaned = "file";
  }
  return cleaned;
}

export function extensionOfFilename(filename: string): string {
  const parts = filename.trim().toLowerCase().split(".");
  return parts.length > 1 ? (parts[parts.length - 1] ?? "") : "";
}

export function isAllowedJagEvidenceFilename(filename: string): boolean {
  const ext = extensionOfFilename(sanitizeJagEvidenceFilename(filename));
  return (JAG_EVIDENCE_ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

export function isAllowedJagEvidenceMimeType(mimeType: string): boolean {
  return (JAG_EVIDENCE_ALLOWED_MIME_TYPES as readonly string[]).includes(
    mimeType.trim().toLowerCase()
  );
}

/**
 * Canonical object path. Organization / document / version IDs are required
 * server inputs — they are never taken from a client path string.
 */
export function buildJagEvidenceObjectPath(input: {
  organizationId: string;
  documentId: string;
  versionId: string;
  filename: string;
}): string {
  const organizationId = assertUuid(input.organizationId, "organizationId");
  const documentId = assertUuid(input.documentId, "documentId");
  const versionId = assertUuid(input.versionId, "versionId");
  const safeFilename = sanitizeJagEvidenceFilename(input.filename);
  if (!isAllowedJagEvidenceFilename(safeFilename)) {
    throw new Error(
      "Unsupported JAG Evidence file type. Use PDF, DOCX, XLSX, CSV, PPTX, or TXT."
    );
  }
  return `org/${organizationId}/documents/${documentId}/versions/${versionId}/${safeFilename}`;
}

export function parseJagEvidenceObjectPath(path: string): JagEvidenceObjectRef {
  const normalized = path.replace(/^\/+/, "").trim();
  if (!normalized || normalized.includes("..")) {
    throw new Error("Invalid JAG Evidence object path");
  }
  const match = PATH_RE.exec(normalized);
  if (!match) {
    throw new Error("Invalid JAG Evidence object path shape");
  }
  const organizationId = assertUuid(match[1]!, "organizationId");
  const documentId = assertUuid(match[2]!, "documentId");
  const versionId = assertUuid(match[3]!, "versionId");
  const safeFilename = sanitizeJagEvidenceFilename(match[4]!);
  if (safeFilename !== match[4]) {
    throw new Error("Invalid JAG Evidence object filename segment");
  }
  return {
    bucket: JAG_EVIDENCE_DOCUMENTS_BUCKET,
    path: `org/${organizationId}/documents/${documentId}/versions/${versionId}/${safeFilename}`,
    organizationId,
    documentId,
    versionId,
    safeFilename,
  };
}

/**
 * Reject paths that do not belong to the authorized organization.
 * Use after parsing any client- or storage-returned path.
 */
export function assertJagEvidencePathForOrganization(
  organizationId: string,
  path: string
): JagEvidenceObjectRef {
  const expectedOrg = assertUuid(organizationId, "organizationId");
  const parsed = parseJagEvidenceObjectPath(path);
  if (parsed.organizationId !== expectedOrg) {
    throw new Error(
      "JAG Evidence object path organization mismatch — access denied"
    );
  }
  return parsed;
}

/**
 * Reject attempts to smuggle a different org via a prebuilt path string.
 * Callers must build paths with buildJagEvidenceObjectPath(serverIds…).
 */
export function rejectArbitraryOrganizationPath(
  authorizedOrganizationId: string,
  candidatePath: string
): void {
  assertJagEvidencePathForOrganization(authorizedOrganizationId, candidatePath);
}

/** Phase 2/4 foundation — signed URL + remove helpers require a server storage client. */
export type JagEvidenceSignedUrlClient = {
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (
        path: string,
        expiresIn: number
      ) => Promise<{
        data: { signedUrl: string } | null;
        error: { message: string } | null;
      }>;
      createSignedUploadUrl?: (
        path: string
      ) => Promise<{
        data: { signedUrl: string; token?: string; path?: string } | null;
        error: { message: string } | null;
      }>;
      remove?: (
        paths: string[]
      ) => Promise<{
        data: unknown;
        error: { message: string; status?: number; statusCode?: string } | null;
      }>;
    };
  };
};

function isMissingStorageObjectError(error: {
  message: string;
  status?: number;
  statusCode?: string;
}): boolean {
  const status = error.status;
  const code = (error.statusCode ?? "").toLowerCase();
  const message = error.message.toLowerCase();
  if (status === 404) return true;
  if (code === "404" || code.includes("not_found")) return true;
  return (
    message.includes("not found") ||
    message.includes("does not exist") ||
    message.includes("no such file") ||
    message.includes("object not found")
  );
}

/**
 * Delete one Storage object at a server-validated path.
 * Missing objects are treated as already gone (safe to continue).
 * Any other Storage error fails closed — callers must not delete DB rows.
 */
export async function removeJagEvidenceStorageObject(input: {
  client: JagEvidenceSignedUrlClient;
  organizationId: string;
  documentId: string;
  versionId: string;
  path: string;
}): Promise<{ ok: true; absent?: boolean } | { ok: false; error: string }> {
  let parsed: JagEvidenceObjectRef;
  try {
    parsed = assertJagEvidencePathForOrganization(
      input.organizationId,
      input.path
    );
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Invalid storage path.",
    };
  }
  if (parsed.bucket !== JAG_EVIDENCE_DOCUMENTS_BUCKET) {
    return { ok: false, error: "Unexpected Evidence storage bucket." };
  }
  if (parsed.documentId !== input.documentId.toLowerCase()) {
    return { ok: false, error: "Storage path document mismatch — access denied." };
  }
  if (parsed.versionId !== input.versionId.toLowerCase()) {
    return { ok: false, error: "Storage path version mismatch — access denied." };
  }

  const bucket = input.client.storage.from(JAG_EVIDENCE_DOCUMENTS_BUCKET);
  if (typeof bucket.remove !== "function") {
    return {
      ok: false,
      error: "JAG Evidence storage remove is not available on this client.",
    };
  }
  const { error } = await bucket.remove([parsed.path]);
  if (!error) return { ok: true };
  if (isMissingStorageObjectError(error)) return { ok: true, absent: true };
  return { ok: false, error: error.message };
}

/**
 * Mints a short-lived download URL after the caller has authorized the org.
 */
export async function createJagEvidenceSignedDownloadUrl(input: {
  client: JagEvidenceSignedUrlClient;
  organizationId: string;
  path: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const ref = assertJagEvidencePathForOrganization(
    input.organizationId,
    input.path
  );
  const expires = input.expiresInSeconds ?? 120;
  const { data, error } = await input.client.storage
    .from(JAG_EVIDENCE_DOCUMENTS_BUCKET)
    .createSignedUrl(ref.path, expires);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Failed to mint JAG Evidence download URL");
  }
  return data.signedUrl;
}

/**
 * Mints a short-lived signed upload URL for an exact server-built object path.
 * Requires a client that supports createSignedUploadUrl.
 */
export async function createJagEvidenceSignedUploadUrl(input: {
  client: JagEvidenceSignedUrlClient;
  organizationId: string;
  documentId: string;
  versionId: string;
  filename: string;
}): Promise<{ path: string; signedUrl: string; token?: string }> {
  const path = buildJagEvidenceObjectPath({
    organizationId: input.organizationId,
    documentId: input.documentId,
    versionId: input.versionId,
    filename: input.filename,
  });
  assertJagEvidencePathForOrganization(input.organizationId, path);

  const bucket = input.client.storage.from(JAG_EVIDENCE_DOCUMENTS_BUCKET);
  if (typeof bucket.createSignedUploadUrl !== "function") {
    throw new Error(
      "JAG Evidence signed upload is not available on this storage client (Phase 2)"
    );
  }
  const { data, error } = await bucket.createSignedUploadUrl(path);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Failed to mint JAG Evidence upload URL");
  }
  return {
    path,
    signedUrl: data.signedUrl,
    token: data.token,
  };
}
