import { NextResponse } from "next/server";
import {
  canAccessConnectorOrganization,
  listGoogleWorkspaceSyncHistory,
  runGoogleWorkspaceSync,
} from "@/lib/connectors";
import { resolveConnectorOrganization } from "@/lib/connectors/access";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export async function GET(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId") ?? "";
  if (!organizationId || !canAccessConnectorOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    history: listGoogleWorkspaceSyncHistory(organizationId),
  });
}

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

  const org = resolveConnectorOrganization(session, organizationId);
  const result = await runGoogleWorkspaceSync({
    organizationId,
    organizationName: org?.name ?? "Organization",
    actorUserId: session.userId,
    actorDisplayName: session.displayName,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, job: result.job },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    job: result.job,
    evidenceIds: result.evidenceIds,
    recordsImported: result.recordsImported,
    calendarEvents: result.calendarEvents,
    messages: result.messages,
    contacts: result.contacts,
    history: listGoogleWorkspaceSyncHistory(organizationId),
  });
}
