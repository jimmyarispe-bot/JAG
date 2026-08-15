/**
 * Client helper: authorize → PUT/uploadToSignedUrl → complete.
 */

export type EvidenceUploadAuthorizeResponse = {
  ok?: boolean;
  error?: string;
  documentId?: string;
  versionId?: string;
  bucket?: string;
  path?: string;
  signedUrl?: string;
  token?: string | null;
  mimeType?: string;
};

async function putToSignedUrl(input: {
  signedUrl: string;
  token?: string | null;
  file: File;
  mimeType: string;
}): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": input.mimeType || input.file.type || "application/octet-stream",
  };
  if (input.token) {
    headers.Authorization = `Bearer ${input.token}`;
  }
  const response = await fetch(input.signedUrl, {
    method: "PUT",
    headers,
    body: input.file,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Storage upload failed (${response.status})`);
  }
}

export async function runJagEvidenceSingleUpload(input: {
  organizationId: string;
  organizationName: string;
  file: File;
  mode?: "create" | "version";
  documentId?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ documentId: string; versionId: string }> {
  if (!input.file || input.file.size <= 0) {
    throw new Error("Select a non-empty file.");
  }

  const authorizeResponse = await fetch(
    "/api/jag-platform/evidence/uploads/authorize",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: input.mode ?? "create",
        organizationId: input.organizationId,
        organizationName: input.organizationName,
        documentId: input.documentId,
        filename: input.file.name,
        mimeType: input.file.type,
        byteSize: input.file.size,
        ...(input.metadata ?? {}),
      }),
    }
  );
  const authorized =
    (await authorizeResponse.json()) as EvidenceUploadAuthorizeResponse;
  if (!authorizeResponse.ok || !authorized.ok) {
    throw new Error(authorized.error ?? "Upload authorization failed.");
  }
  if (
    !authorized.signedUrl ||
    !authorized.documentId ||
    !authorized.versionId ||
    !authorized.path
  ) {
    throw new Error("Upload authorization returned an incomplete response.");
  }

  await putToSignedUrl({
    signedUrl: authorized.signedUrl,
    token: authorized.token,
    file: input.file,
    mimeType: authorized.mimeType || input.file.type,
  });

  const completeResponse = await fetch(
    "/api/jag-platform/evidence/uploads/complete",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: input.organizationId,
        documentId: authorized.documentId,
        versionId: authorized.versionId,
      }),
    }
  );
  const completed = (await completeResponse.json()) as {
    ok?: boolean;
    error?: string;
  };
  if (!completeResponse.ok || !completed.ok) {
    throw new Error(completed.error ?? "Upload verification failed.");
  }

  return {
    documentId: authorized.documentId,
    versionId: authorized.versionId,
  };
}
