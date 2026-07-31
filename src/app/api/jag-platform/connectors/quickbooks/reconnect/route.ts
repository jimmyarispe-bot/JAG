import { NextResponse } from "next/server";
import {
  buildQuickBooksAuthorizeUrl,
  canAccessConnectorOrganization,
  connectQuickBooksDemo,
  disconnectQuickBooks,
  quickbooksClientConfig,
} from "@/lib/connectors";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

/**
 * POST — disconnect then start a fresh OAuth / demo connect.
 */
export async function POST(request: Request) {
  const session = await getJagPlatformSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    organizationId?: string;
    demo?: boolean;
  };
  const organizationId = body.organizationId ?? "";
  if (!organizationId || !canAccessConnectorOrganization(session, organizationId)) {
    return NextResponse.json(
      { ok: false, error: "Organization access denied." },
      { status: 403 }
    );
  }

  disconnectQuickBooks(organizationId);

  const { configured } = quickbooksClientConfig();
  const useDemo = body.demo === true || !configured;
  if (useDemo) {
    const installation = connectQuickBooksDemo({ organizationId });
    return NextResponse.json({ ok: true, demo: true, installation });
  }

  const auth = buildQuickBooksAuthorizeUrl({
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
