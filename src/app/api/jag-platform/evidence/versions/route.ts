import { NextResponse } from "next/server";
import {
  canAccessEvidenceOrganization,
  getVersionsForOrganization,
} from "@/lib/evidence-center";
import {
  listDurableVersionsForDocument,
  mapDurableVersionToCatalog,
} from "@/lib/evidence-center/durable-repository";
import { isJagEvidenceMemoryFallbackEnabled } from "@/lib/evidence-center/memory-fallback";
import { createJagEvidenceUploadDeps } from "@/lib/evidence-center/upload-deps";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export async function GET(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId") ?? "";
  const documentId = searchParams.get("documentId") ?? "";
  if (!canAccessEvidenceOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }

  try {
    const deps = createJagEvidenceUploadDeps();
    const durable = await listDurableVersionsForDocument(
      deps.db,
      organizationId,
      documentId
    );
    const mapped = durable.map((row, index) => {
      const base = mapDurableVersionToCatalog(row);
      return {
        ...base,
        isLatest: index === 0,
        superseded: index !== 0,
      };
    });
    if (durable.length > 0 || !isJagEvidenceMemoryFallbackEnabled()) {
      return NextResponse.json({ ok: true, versions: mapped });
    }
  } catch {
    if (!isJagEvidenceMemoryFallbackEnabled()) {
      return NextResponse.json({ ok: true, versions: [] });
    }
  }

  return NextResponse.json({
    ok: true,
    versions: getVersionsForOrganization(organizationId, documentId),
  });
}

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Metadata-only version upload is retired. Use /api/jag-platform/evidence/uploads/authorize with mode=version.",
    },
    { status: 410 }
  );
}
