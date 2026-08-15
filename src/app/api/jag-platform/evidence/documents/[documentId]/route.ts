import { NextResponse } from "next/server";
import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import { getDurableDocumentById } from "@/lib/evidence-center/durable-repository";
import { createJagEvidenceUploadDeps } from "@/lib/evidence-center/upload-deps";
import { deleteDurableEvidenceDocument } from "@/lib/evidence-center/upload-service";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

/**
 * DELETE /api/jag-platform/evidence/documents/[documentId]
 *
 * Client supplies documentId only (path param). Organization, version IDs, and
 * Storage paths are derived from durable DB rows after session + org authorization.
 * Request body fields (organizationId, storage_path, etc.) are ignored.
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ documentId: string }> }
) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { documentId: rawDocumentId } = await context.params;
  const documentId = String(rawDocumentId ?? "").trim();
  if (!documentId) {
    return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
  }

  const deps = createJagEvidenceUploadDeps();
  const owned = await getDurableDocumentById(deps.db, documentId);
  if (!owned) {
    return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
  }

  if (!canAccessEvidenceOrganization(session, owned.organization_id)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }

  const result = await deleteDurableEvidenceDocument(deps, {
    organizationId: owned.organization_id,
    documentId: owned.id,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status ?? 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    documentId: result.documentId,
    deletedVersionCount: result.deletedVersionCount,
    deletedStorageObjectCount: result.deletedStorageObjectCount,
  });
}
