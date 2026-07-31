import { NextResponse } from "next/server";
import {
  canAccessConnectorOrganization,
  getConnectorFramework,
} from "@/lib/connectors";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export async function POST(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    organizationId?: string;
    connectorId?: string;
  };
  const organizationId = body.organizationId ?? "";
  const connectorId = body.connectorId ?? "";

  if (!organizationId || !canAccessConnectorOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }

  if (!connectorId) {
    return NextResponse.json(
      { ok: false, error: "connectorId is required." },
      { status: 400 }
    );
  }

  const installation = getConnectorFramework().installPlaceholder(
    organizationId,
    connectorId
  );
  if (!installation) {
    return NextResponse.json(
      { ok: false, error: "Unknown or unavailable connector." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, installation });
}
