import { NextResponse } from "next/server";
import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import { createJagEvidenceUploadDeps } from "@/lib/evidence-center/upload-deps";
import { authorizeEvidenceUpload } from "@/lib/evidence-center/upload-service";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export async function POST(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const organizationId = String(body.organizationId ?? "").trim();
  if (!organizationId || !canAccessEvidenceOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }

  const mode = body.mode === "version" ? "version" : "create";
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t))
    : typeof body.tags === "string"
      ? body.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

  const deps = createJagEvidenceUploadDeps();
  const result = await authorizeEvidenceUpload(deps, {
    mode,
    organizationId,
    organizationName: String(body.organizationName ?? ""),
    actorUserId: session.userId,
    actorDisplayName: session.displayName,
    filename: String(body.filename ?? body.fileName ?? ""),
    mimeType: body.mimeType ? String(body.mimeType) : null,
    byteSize:
      typeof body.byteSize === "number" ? body.byteSize : Number(body.byteSize) || 0,
    documentId: body.documentId ? String(body.documentId) : undefined,
    name: body.name ? String(body.name) : undefined,
    domain: body.domain ? String(body.domain) : undefined,
    evidenceType: body.evidenceType ? String(body.evidenceType) : undefined,
    description: body.description ? String(body.description) : undefined,
    tags,
    reportingPeriodKind: body.reportingPeriodKind
      ? String(body.reportingPeriodKind)
      : undefined,
    reportingPeriodLabel: body.reportingPeriodLabel
      ? String(body.reportingPeriodLabel)
      : undefined,
    businessUnit: body.businessUnit ? String(body.businessUnit) : undefined,
    department: body.department ? String(body.department) : undefined,
    location: body.location ? String(body.location) : undefined,
    owner: body.owner ? String(body.owner) : undefined,
    source: body.source ? String(body.source) : undefined,
    confidentiality: body.confidentiality
      ? String(body.confidentiality)
      : undefined,
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
    versionId: result.versionId,
    versionNumber: result.versionNumber,
    bucket: result.bucket,
    path: result.path,
    signedUrl: result.signedUrl,
    token: result.token ?? null,
    mimeType: result.mimeType,
    byteSize: result.byteSize,
    safeFilename: result.safeFilename,
  });
}
