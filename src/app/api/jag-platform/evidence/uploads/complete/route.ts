import { NextResponse } from "next/server";
import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import { createJagEvidenceUploadDeps } from "@/lib/evidence-center/upload-deps";
import { completeEvidenceUpload } from "@/lib/evidence-center/upload-service";
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

  const deps = createJagEvidenceUploadDeps();
  const result = await completeEvidenceUpload(deps, {
    organizationId,
    documentId: String(body.documentId ?? ""),
    versionId: String(body.versionId ?? ""),
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
    lifecycleStatus: result.lifecycleStatus,
  });
}
