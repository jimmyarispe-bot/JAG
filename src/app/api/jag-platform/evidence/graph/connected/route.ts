import { NextResponse } from "next/server";
import {
  canAccessEvidenceOrganization,
  queryConnectedEvidence,
} from "@/lib/evidence-center";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export async function GET(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId") ?? "";
  const nodeId = searchParams.get("nodeId") ?? "";
  if (!organizationId || !canAccessEvidenceOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }
  if (!nodeId) {
    return NextResponse.json(
      { ok: false, error: "nodeId is required." },
      { status: 400 }
    );
  }

  const result = queryConnectedEvidence(organizationId, nodeId);
  if (!result) {
    return NextResponse.json({ ok: false, error: "Node not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...result });
}
