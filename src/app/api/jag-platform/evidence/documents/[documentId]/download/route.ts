import { NextResponse } from "next/server";
import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import { getDurableDocument } from "@/lib/evidence-center/durable-repository";
import { createJagEvidenceUploadDeps } from "@/lib/evidence-center/upload-deps";
import { createEvidenceDownloadUrl } from "@/lib/evidence-center/upload-service";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export async function GET(
  request: Request,
  context: { params: Promise<{ documentId: string }> }
) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await context.params;
  const { searchParams } = new URL(request.url);
  const organizationId = (searchParams.get("organizationId") ?? "").trim();
  const versionId = searchParams.get("versionId");

  if (!organizationId || !canAccessEvidenceOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }

  const deps = createJagEvidenceUploadDeps();
  const owned = await getDurableDocument(deps.db, organizationId, documentId);
  if (!owned) {
    return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
  }

  const result = await createEvidenceDownloadUrl(deps, {
    organizationId,
    documentId,
    versionId: versionId ? versionId : undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status ?? 400 }
    );
  }

  const wantsJson = request.headers.get("accept")?.includes("application/json");
  if (wantsJson) {
    return NextResponse.json({
      ok: true,
      signedUrl: result.signedUrl,
      filename: result.filename,
      path: result.path,
    });
  }

  return NextResponse.redirect(result.signedUrl);
}
