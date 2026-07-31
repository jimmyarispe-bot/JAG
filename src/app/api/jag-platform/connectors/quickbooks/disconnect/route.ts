import { NextResponse } from "next/server";
import {
  canAccessConnectorOrganization,
  disconnectQuickBooks,
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

  const installation = disconnectQuickBooks(organizationId);
  if (!installation) {
    return NextResponse.json(
      { ok: false, error: "QuickBooks installation not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, installation });
}
