import { NextResponse } from "next/server";
import {
  buildGoogleWorkspaceJagAuthorizeUrl,
  canAccessConnectorOrganization,
  connectGoogleWorkspaceDemo,
  googleWorkspaceJagClientConfig,
} from "@/lib/connectors";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export async function POST(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    organizationId?: string;
    demo?: boolean;
    userEmail?: string;
    domain?: string;
    scheduleFrequency?: "Manual" | "Daily" | "Weekly";
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const organizationId = body.organizationId ?? "";
  if (!organizationId || !canAccessConnectorOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }

  const { configured } = googleWorkspaceJagClientConfig();
  const useDemo = body.demo === true || !configured;

  if (useDemo) {
    const installation = connectGoogleWorkspaceDemo({
      organizationId,
      userEmail: body.userEmail,
      domain: body.domain,
      scheduleFrequency: body.scheduleFrequency,
    });
    return NextResponse.json({
      ok: true,
      demo: true,
      installation,
      message: configured
        ? "Connected (demo mode)."
        : "Connected in demo mode — set GOOGLE_WORKSPACE_CLIENT_ID/SECRET for live OAuth.",
    });
  }

  const auth = buildGoogleWorkspaceJagAuthorizeUrl({
    organizationId,
    userId: session.userId,
  });
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    demo: false,
    authorizeUrl: auth.authorizeUrl,
  });
}
