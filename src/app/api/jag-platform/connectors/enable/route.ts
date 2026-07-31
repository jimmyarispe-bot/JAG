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
    installationId?: string;
    enabled?: boolean;
  };
  const organizationId = body.organizationId ?? "";
  const installationId = body.installationId ?? "";

  if (!organizationId || !canAccessConnectorOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }

  if (!installationId || typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { ok: false, error: "installationId and enabled are required." },
      { status: 400 }
    );
  }

  const installation = getConnectorFramework().setEnabled(
    organizationId,
    installationId,
    body.enabled
  );
  if (!installation) {
    return NextResponse.json(
      { ok: false, error: "Installation not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, installation });
}
