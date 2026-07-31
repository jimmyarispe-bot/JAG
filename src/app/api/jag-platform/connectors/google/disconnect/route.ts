import { NextResponse } from "next/server";
import {
  canAccessConnectorOrganization,
  disconnectGoogleWorkspace,
} from "@/lib/connectors";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export async function POST(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { organizationId?: string };
  const organizationId = body.organizationId ?? "";
  if (!organizationId || !canAccessConnectorOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }

  const installation = disconnectGoogleWorkspace(organizationId);
  if (!installation) {
    return NextResponse.json(
      { ok: false, error: "Google Workspace installation not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, installation });
}
