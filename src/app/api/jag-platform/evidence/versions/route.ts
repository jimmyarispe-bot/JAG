import { NextResponse } from "next/server";
import {
  addEvidenceVersion,
  canAccessEvidenceOrganization,
  getVersionsForOrganization,
} from "@/lib/evidence-center";
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
  return NextResponse.json({
    ok: true,
    versions: getVersionsForOrganization(organizationId, documentId),
  });
}

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
  const organizationId = String(body.organizationId ?? "");
  if (!canAccessEvidenceOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }
  const result = addEvidenceVersion({
    organizationId,
    documentId: String(body.documentId ?? ""),
    fileName: String(body.fileName ?? ""),
    mimeType: body.mimeType ? String(body.mimeType) : undefined,
    byteSize:
      typeof body.byteSize === "number" ? body.byteSize : Number(body.byteSize) || 0,
    createdBy: session.userId,
    createdByName: session.displayName,
    notes: body.notes ? String(body.notes) : "",
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    document: result.document,
    version: result.version,
  });
}
