import { NextResponse } from "next/server";
import {
  canAccessEvidenceOrganization,
  uploadEvidence,
} from "@/lib/evidence-center";
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
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const organizationId = String(body.organizationId ?? "");
  if (!canAccessEvidenceOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t))
    : typeof body.tags === "string"
      ? body.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

  const result = uploadEvidence({
    organizationId,
    organizationName: String(body.organizationName ?? ""),
    fileName: String(body.fileName ?? ""),
    mimeType: body.mimeType ? String(body.mimeType) : undefined,
    byteSize:
      typeof body.byteSize === "number" ? body.byteSize : Number(body.byteSize) || 0,
    name: body.name ? String(body.name) : undefined,
    domain: String(body.domain ?? ""),
    evidenceType: String(body.evidenceType ?? ""),
    description: body.description ? String(body.description) : "",
    tags,
    reportingPeriodKind: body.reportingPeriodKind
      ? String(body.reportingPeriodKind)
      : "Custom",
    reportingPeriodLabel: String(
      body.reportingPeriodLabel ?? body.reportingPeriod ?? ""
    ),
    businessUnit: body.businessUnit ? String(body.businessUnit) : "Corporate",
    department: body.department ? String(body.department) : "",
    location: body.location ? String(body.location) : "",
    owner: body.owner ? String(body.owner) : session.displayName,
    source: body.source ? String(body.source) : "Uploaded",
    confidentiality: body.confidentiality
      ? String(body.confidentiality)
      : "Internal",
    createdBy: session.userId,
    createdByName: session.displayName,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        fieldErrors: result.fieldErrors,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    document: result.document,
  });
}
